using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Application.Models.Sales;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly IAuditLogService _auditLogService;
    private readonly INotificationService _notificationService;

    public SalesController(
        ApplicationDbContext context,
        ITenantProvider tenantProvider,
        IAuditLogService auditLogService,
        INotificationService notificationService)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _auditLogService = auditLogService;
        _notificationService = notificationService;
    }

    [Authorize(Roles = "Owner,Manager,Cashier")]
    [HttpPost]
    public async Task<IActionResult> Checkout([FromBody] CreateSaleDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());

        // Resolve branch context based on user role
        Guid? activeBranchId = null;
        if (userRole == "Manager" || userRole == "Cashier")
        {
            var branchIdClaim = User.FindFirst("branch_id")?.Value;
            if (string.IsNullOrEmpty(branchIdClaim) || !Guid.TryParse(branchIdClaim, out var userBranchId))
            {
                return BadRequest(new { Message = "User branch context not found." });
            }
            activeBranchId = userBranchId;
        }
        else if (userRole == "Owner")
        {
            activeBranchId = _tenantProvider.BranchId;
        }

        // Validate Business context
        var business = await _context.Businesses
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(b => b.Id == tenantId.Value);

        if (business == null) return BadRequest(new { Message = "Business not found." });

        // Enforce that branch-scoped cashiers/managers must register sales under their assigned branch
        if (!business.SharedStockMode && !activeBranchId.HasValue)
        {
            return BadRequest(new { Message = "Branch context is required for sales when Shared Stock Mode is disabled." });
        }

        // Validate payment methods
        if (!Enum.TryParse<PaymentMethod>(dto.PaymentMethod, true, out var paymentMethod))
        {
            return BadRequest(new { Message = "Invalid payment method." });
        }

        // Validate Coupon if provided
        Coupon coupon = null;
        if (!string.IsNullOrWhiteSpace(dto.CouponCode))
        {
            var codeUpper = dto.CouponCode.Trim().ToUpper();
            coupon = await _context.Coupons
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.BusinessId == tenantId.Value && c.Code == codeUpper);

            if (coupon == null)
            {
                return BadRequest(new { Message = $"Coupon code '{codeUpper}' not found." });
            }

            if (!coupon.IsActive)
            {
                return BadRequest(new { Message = "This coupon code is inactive." });
            }

            var now = DateTime.UtcNow;
            if (coupon.StartDate > now || coupon.EndDate < now)
            {
                return BadRequest(new { Message = "This coupon code has expired or is not active yet." });
            }

            if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value)
            {
                return BadRequest(new { Message = "This coupon usage limit has been exceeded." });
            }
        }

        // Calculate subtotal to validate cashier discount limits
        decimal tempSubtotal = 0;
        foreach (var itemDto in dto.Items)
        {
            tempSubtotal += itemDto.Quantity * itemDto.UnitPrice;
        }

        if (userRole == "Cashier")
        {
            if (dto.DiscountAmount > 50000.00m)
            {
                return BadRequest(new { Message = "Cashiers cannot apply a discount exceeding ₦50,000.00." });
            }
            if (tempSubtotal > 0 && (dto.DiscountAmount / tempSubtotal) > 0.15m)
            {
                return BadRequest(new { Message = "Cashiers cannot apply a discount exceeding 15%." });
            }
        }

        if (coupon != null && coupon.MinCartAmount.HasValue && tempSubtotal < coupon.MinCartAmount.Value)
        {
            return BadRequest(new { Message = $"Minimum cart spend of ₦{coupon.MinCartAmount.Value:F2} is required to apply this coupon." });
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var sale = new Sale
            {
                BusinessId = tenantId.Value,
                BranchId = business.SharedStockMode ? null : activeBranchId,
                UserId = currentUserId,
                Subtotal = 0,
                DiscountAmount = dto.DiscountAmount,
                TaxAmount = dto.TaxAmount,
                Total = 0,
                PaymentMethod = paymentMethod,
                PaymentDetails = dto.PaymentDetails,
                AppliedCouponId = coupon?.Id,
                AppliedCouponCode = coupon?.Code
            };

            decimal calculatedSubtotal = 0;

            foreach (var itemDto in dto.Items)
            {
                // Verify product exists and belongs to the business
                var product = await _context.Products
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(p => p.Id == itemDto.ProductId && p.BusinessId == tenantId.Value);

                if (product == null)
                {
                    return BadRequest(new { Message = $"Product with ID {itemDto.ProductId} not found." });
                }

                // Verify stock availability
                var stock = await _context.ProductStocks
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(ps => ps.ProductId == itemDto.ProductId && 
                                               ps.BranchId == (business.SharedStockMode ? null : activeBranchId));

                if (stock == null || stock.Quantity < itemDto.Quantity)
                {
                    return BadRequest(new { Message = $"Insufficient stock for product '{product.Name}'. Available: {stock?.Quantity ?? 0}." });
                }

                int prevStockQty = stock.Quantity;
                stock.Quantity -= itemDto.Quantity;

                decimal itemTotal = (itemDto.Quantity * itemDto.UnitPrice) - itemDto.DiscountAmount;
                calculatedSubtotal += itemDto.Quantity * itemDto.UnitPrice;

                var saleItem = new SaleItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice,
                    CostPrice = product.CostPrice, // Capture cost price at time of sale
                    DiscountAmount = itemDto.DiscountAmount,
                    Total = itemTotal
                };

                sale.SaleItems.Add(saleItem);

                // Add StockAdjustmentLog entry for sale checkout
                var log = new StockAdjustmentLog
                {
                    ProductId = itemDto.ProductId,
                    BranchId = business.SharedStockMode ? null : activeBranchId,
                    PreviousQuantity = prevStockQty,
                    NewQuantity = stock.Quantity,
                    AdjustedByUserId = currentUserId,
                    Reason = $"Checkout Sale (Receipt ID: {sale.Id})"
                };

                _context.StockAdjustmentLogs.Add(log);
            }

            sale.Subtotal = calculatedSubtotal;
            sale.Total = calculatedSubtotal - dto.DiscountAmount + dto.TaxAmount;

            if (coupon != null)
            {
                coupon.UsageCount++;
                _context.Coupons.Update(coupon);
            }

            _context.Sales.Add(sale);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Log SaleProcessed and CouponApplied to audit logs
            var cashierEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "cashier@vendorapos.com";
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            
            await _auditLogService.LogAsync(
                "SaleProcessed",
                $"Processed sale {sale.Id} for total {sale.Total:F2}. Payment method: {sale.PaymentMethod}.",
                cashierEmail,
                tenantId.Value,
                ip
            );

            if (coupon != null)
            {
                await _auditLogService.LogAsync(
                    "CouponApplied",
                    $"Applied coupon '{coupon.Code}' (Discount: {sale.DiscountAmount:F2}) to sale {sale.Id}.",
                    cashierEmail,
                    tenantId.Value,
                    ip
                );
            }

            // Check for low stock alerts on each product item
            if (activeBranchId.HasValue)
            {
                foreach (var itemDto in dto.Items)
                {
                    await _notificationService.CheckAndTriggerLowStockAlertAsync(itemDto.ProductId, activeBranchId.Value);
                }
            }

            // Resolve names for DTO mapping
            var cashierUser = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == currentUserId);
            var branch = activeBranchId.HasValue 
                ? await _context.Branches.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == activeBranchId.Value)
                : null;

            var resultDto = new SaleDto
            {
                Id = sale.Id,
                BranchId = sale.BranchId,
                BranchName = branch?.Name ?? "Global/Shared",
                CashierId = sale.UserId,
                CashierName = cashierUser != null ? $"{cashierUser.FirstName} {cashierUser.LastName}" : "System Cashier",
                Subtotal = sale.Subtotal,
                DiscountAmount = sale.DiscountAmount,
                TaxAmount = sale.TaxAmount,
                Total = sale.Total,
                PaymentMethod = sale.PaymentMethod.ToString(),
                PaymentDetails = sale.PaymentDetails,
                AppliedCouponId = sale.AppliedCouponId,
                AppliedCouponCode = sale.AppliedCouponCode,
                IsRefunded = sale.IsRefunded,
                RefundedAt = sale.RefundedAt,
                CreatedAt = sale.CreatedAt,
                Items = sale.SaleItems.Select(si => new SaleItemDto
                {
                    Id = si.Id,
                    ProductId = si.ProductId,
                    ProductName = _context.Products.IgnoreQueryFilters().FirstOrDefault(p => p.Id == si.ProductId)?.Name ?? "Product",
                    SKU = _context.Products.IgnoreQueryFilters().FirstOrDefault(p => p.Id == si.ProductId)?.SKU ?? "SKU",
                    Quantity = si.Quantity,
                    UnitPrice = si.UnitPrice,
                    CostPrice = si.CostPrice,
                    DiscountAmount = si.DiscountAmount,
                    Total = si.Total
                }).ToList()
            };

            return CreatedAtAction(nameof(GetSale), new { id = sale.Id }, resultDto);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { Message = "An error occurred while completing checkout.", Details = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetSales([FromQuery] Guid? businessId = null, [FromQuery] Guid? branchId = null, [FromQuery] Guid? cashierId = null)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // SuperAdmin can query all sales across the platform
        if (userRole == "SuperAdmin")
        {
            var queryAdmin = _context.Sales
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Include(s => s.User)
                .Include(s => s.Branch)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .AsQueryable();

            if (businessId.HasValue)
            {
                queryAdmin = queryAdmin.Where(s => s.BusinessId == businessId.Value);
            }
            if (branchId.HasValue)
            {
                queryAdmin = queryAdmin.Where(s => s.BranchId == branchId.Value);
            }
            if (cashierId.HasValue)
            {
                queryAdmin = queryAdmin.Where(s => s.UserId == cashierId.Value);
            }

            var adminSales = await queryAdmin
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new SaleDto
                {
                    Id = s.Id,
                    BranchId = s.BranchId,
                    BranchName = s.Branch != null ? s.Branch.Name : "Global/Shared",
                    CashierId = s.UserId,
                    CashierName = s.User != null ? $"{s.User.FirstName} {s.User.LastName}" : "System",
                    Subtotal = s.Subtotal,
                    DiscountAmount = s.DiscountAmount,
                    TaxAmount = s.TaxAmount,
                    Total = s.Total,
                    PaymentMethod = s.PaymentMethod.ToString(),
                    PaymentDetails = s.PaymentDetails,
                    AppliedCouponId = s.AppliedCouponId,
                    AppliedCouponCode = s.AppliedCouponCode,
                    IsRefunded = s.IsRefunded,
                    RefundedAt = s.RefundedAt,
                    CreatedAt = s.CreatedAt,
                    Items = s.SaleItems.Select(si => new SaleItemDto
                    {
                        Id = si.Id,
                        ProductId = si.ProductId,
                        ProductName = si.Product != null ? si.Product.Name : "Product",
                        SKU = si.Product != null ? si.Product.SKU : "SKU",
                        Quantity = si.Quantity,
                        UnitPrice = si.UnitPrice,
                        CostPrice = si.CostPrice,
                        DiscountAmount = si.DiscountAmount,
                        Total = si.Total
                    }).ToList()
                })
                .ToListAsync();

            return Ok(adminSales);
        }

        // For Owner, Manager, Cashier, they must have a tenant context
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var activeBranchId = _tenantProvider.BranchId;
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());

        if (userRole == "Manager" || userRole == "Cashier")
        {
            var branchIdClaim = User.FindFirst("branch_id")?.Value;
            if (string.IsNullOrEmpty(branchIdClaim) || !Guid.TryParse(branchIdClaim, out var userBranchId))
            {
                return BadRequest(new { Message = "User branch context not found." });
            }
            activeBranchId = userBranchId;
        }

        var queryOwner = _context.Sales
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(s => s.User)
            .Include(s => s.Branch)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Product)
            .Where(s => s.BusinessId == tenantId.Value);

        if (userRole == "Cashier")
        {
            queryOwner = queryOwner.Where(s => s.UserId == currentUserId);
        }
        else 
        {
            // Owner and Manager can filter by branch and cashier
            if (branchId.HasValue)
            {
                queryOwner = queryOwner.Where(s => s.BranchId == branchId.Value);
            }
            else if (activeBranchId.HasValue)
            {
                queryOwner = queryOwner.Where(s => s.BranchId == activeBranchId.Value);
            }

            if (cashierId.HasValue)
            {
                queryOwner = queryOwner.Where(s => s.UserId == cashierId.Value);
            }
        }

        var sales = await queryOwner
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SaleDto
            {
                Id = s.Id,
                BranchId = s.BranchId,
                BranchName = s.Branch != null ? s.Branch.Name : "Global/Shared",
                CashierId = s.UserId,
                CashierName = s.User != null ? $"{s.User.FirstName} {s.User.LastName}" : "System Cashier",
                Subtotal = s.Subtotal,
                DiscountAmount = s.DiscountAmount,
                TaxAmount = s.TaxAmount,
                Total = s.Total,
                PaymentMethod = s.PaymentMethod.ToString(),
                PaymentDetails = s.PaymentDetails,
                AppliedCouponId = s.AppliedCouponId,
                AppliedCouponCode = s.AppliedCouponCode,
                IsRefunded = s.IsRefunded,
                RefundedAt = s.RefundedAt,
                CreatedAt = s.CreatedAt,
                Items = s.SaleItems.Select(si => new SaleItemDto
                {
                    Id = si.Id,
                    ProductId = si.ProductId,
                    ProductName = si.Product != null ? si.Product.Name : "Product",
                    SKU = si.Product != null ? si.Product.SKU : "SKU",
                    Quantity = si.Quantity,
                    UnitPrice = si.UnitPrice,
                    CostPrice = si.CostPrice,
                    DiscountAmount = si.DiscountAmount,
                    Total = si.Total
                }).ToList()
            })
            .ToListAsync();

        return Ok(sales);
    }

    [HttpGet("cashier-stats")]
    public async Task<IActionResult> GetCashierStats()
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());

        var now = DateTime.UtcNow;
        var todayLocal = now.Date;
        var startOfWeek = todayLocal.AddDays(-(int)todayLocal.DayOfWeek);
        var startOfMonth = new DateTime(todayLocal.Year, todayLocal.Month, 1);

        var cashierSales = await _context.Sales
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Product)
            .Where(s => s.BusinessId == tenantId.Value && s.UserId == currentUserId)
            .ToListAsync();

        var todaySales = cashierSales.Where(s => s.CreatedAt.Date == todayLocal).ToList();
        var weeklySales = cashierSales.Where(s => s.CreatedAt.Date >= startOfWeek).ToList();
        var monthlySales = cashierSales.Where(s => s.CreatedAt.Date >= startOfMonth).ToList();

        var todayAmount = todaySales.Sum(s => s.Total);
        var todayCount = todaySales.Count;

        var weeklyAmount = weeklySales.Sum(s => s.Total);
        var weeklyCount = weeklySales.Count;

        var monthlyAmount = monthlySales.Sum(s => s.Total);
        var monthlyCount = monthlySales.Count;

        var lifetimeAmount = cashierSales.Sum(s => s.Total);
        var lifetimeCount = cashierSales.Count;

        var atv = lifetimeCount > 0 ? lifetimeAmount / lifetimeCount : 0m;

        // Payment Method breakdown
        var methodAmounts = new Dictionary<string, decimal>();
        var methodCounts = new Dictionary<string, int>();

        foreach (var m in Enum.GetValues<PaymentMethod>())
        {
            var mStr = m.ToString();
            var matches = cashierSales.Where(s => s.PaymentMethod == m).ToList();
            methodAmounts[mStr] = matches.Sum(s => s.Total);
            methodCounts[mStr] = matches.Count;
        }

        // Top Selling Products
        var productSales = cashierSales
            .SelectMany(s => s.SaleItems)
            .GroupBy(si => si.Product.Name)
            .Select(g => new TopProductDto
            {
                ProductName = g.Key,
                QuantitySold = g.Sum(si => si.Quantity),
                TotalRevenue = g.Sum(si => si.Total)
            })
            .OrderByDescending(tp => tp.QuantitySold)
            .Take(5)
            .ToList();

        // Daily Trend for the past 7 days
        var dailyTrendList = new List<DailySaleTrendDto>();
        for (int i = 6; i >= 0; i--)
        {
            var dateTarget = todayLocal.AddDays(-i);
            var dateStr = dateTarget.ToString("yyyy-MM-dd");
            var matches = cashierSales.Where(s => s.CreatedAt.Date == dateTarget).ToList();
            dailyTrendList.Add(new DailySaleTrendDto
            {
                Date = dateStr,
                Amount = matches.Sum(s => s.Total),
                Count = matches.Count
            });
        }

        var stats = new CashierStatsDto
        {
            TodaySalesAmount = todayAmount,
            TodaySalesCount = todayCount,
            WeeklySalesAmount = weeklyAmount,
            WeeklySalesCount = weeklyCount,
            MonthlySalesAmount = monthlyAmount,
            MonthlySalesCount = monthlyCount,
            LifetimeSalesAmount = lifetimeAmount,
            LifetimeSalesCount = lifetimeCount,
            AverageTransactionValue = atv,
            PaymentMethodAmounts = methodAmounts,
            PaymentMethodCounts = methodCounts,
            TopProducts = productSales,
            DailySalesTrend = dailyTrendList
        };

        return Ok(stats);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSale(Guid id)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userRole == "SuperAdmin")
        {
            var saleAdmin = await _context.Sales
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Include(s => s.User)
                .Include(s => s.Branch)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (saleAdmin == null) return NotFound();

            var dtoAdmin = new SaleDto
            {
                Id = saleAdmin.Id,
                BranchId = saleAdmin.BranchId,
                BranchName = saleAdmin.Branch != null ? saleAdmin.Branch.Name : "Global/Shared",
                CashierId = saleAdmin.UserId,
                CashierName = saleAdmin.User != null ? $"{saleAdmin.User.FirstName} {saleAdmin.User.LastName}" : "System",
                Subtotal = saleAdmin.Subtotal,
                DiscountAmount = saleAdmin.DiscountAmount,
                TaxAmount = saleAdmin.TaxAmount,
                Total = saleAdmin.Total,
                PaymentMethod = saleAdmin.PaymentMethod.ToString(),
                PaymentDetails = saleAdmin.PaymentDetails,
                AppliedCouponId = saleAdmin.AppliedCouponId,
                AppliedCouponCode = saleAdmin.AppliedCouponCode,
                IsRefunded = saleAdmin.IsRefunded,
                RefundedAt = saleAdmin.RefundedAt,
                CreatedAt = saleAdmin.CreatedAt,
                Items = saleAdmin.SaleItems.Select(si => new SaleItemDto
                {
                    Id = si.Id,
                    ProductId = si.ProductId,
                    ProductName = si.Product != null ? si.Product.Name : "Product",
                    SKU = si.Product != null ? si.Product.SKU : "SKU",
                    Quantity = si.Quantity,
                    UnitPrice = si.UnitPrice,
                    CostPrice = si.CostPrice,
                    DiscountAmount = si.DiscountAmount,
                    Total = si.Total
                }).ToList()
            };

            return Ok(dtoAdmin);
        }

        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var activeBranchId = _tenantProvider.BranchId;
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());

        if (userRole == "Manager" || userRole == "Cashier")
        {
            var branchIdClaim = User.FindFirst("branch_id")?.Value;
            if (string.IsNullOrEmpty(branchIdClaim) || !Guid.TryParse(branchIdClaim, out var userBranchId))
            {
                return BadRequest(new { Message = "User branch context not found." });
            }
            activeBranchId = userBranchId;
        }

        var sale = await _context.Sales
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(s => s.User)
            .Include(s => s.Branch)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Product)
            .FirstOrDefaultAsync(s => s.Id == id && s.BusinessId == tenantId.Value);

        if (sale == null) return NotFound();

        // Access scope check
        if (userRole == "Cashier")
        {
            if (sale.UserId != currentUserId)
            {
                return Forbid();
            }
        }
        else if (activeBranchId.HasValue && sale.BranchId != activeBranchId.Value)
        {
            return Forbid();
        }

        var dto = new SaleDto
        {
            Id = sale.Id,
            BranchId = sale.BranchId,
            BranchName = sale.Branch != null ? sale.Branch.Name : "Global/Shared",
            CashierId = sale.UserId,
            CashierName = sale.User != null ? $"{sale.User.FirstName} {sale.User.LastName}" : "System Cashier",
            Subtotal = sale.Subtotal,
            DiscountAmount = sale.DiscountAmount,
            TaxAmount = sale.TaxAmount,
            Total = sale.Total,
            PaymentMethod = sale.PaymentMethod.ToString(),
            PaymentDetails = sale.PaymentDetails,
            AppliedCouponId = sale.AppliedCouponId,
            AppliedCouponCode = sale.AppliedCouponCode,
            IsRefunded = sale.IsRefunded,
            RefundedAt = sale.RefundedAt,
            CreatedAt = sale.CreatedAt,
            Items = sale.SaleItems.Select(si => new SaleItemDto
            {
                Id = si.Id,
                ProductId = si.ProductId,
                ProductName = si.Product != null ? si.Product.Name : "Product",
                SKU = si.Product != null ? si.Product.SKU : "SKU",
                Quantity = si.Quantity,
                UnitPrice = si.UnitPrice,
                CostPrice = si.CostPrice,
                DiscountAmount = si.DiscountAmount,
                Total = si.Total
            }).ToList()
        };

        return Ok(dto);
    }

    [AllowAnonymous]
    [HttpGet("verify/{id}")]
    public async Task<IActionResult> VerifySale(Guid id)
    {
        var sale = await _context.Sales
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(s => s.Business)
            .Include(s => s.Branch)
            .Include(s => s.User)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Product)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sale == null)
        {
            return NotFound(new { Message = "Receipt not found or invalid verification ID." });
        }

        var dto = new VerifiedSaleDto
        {
            SaleId = sale.Id,
            BusinessName = sale.Business.Name,
            BranchName = sale.Branch?.Name ?? "Global/Shared",
            BranchAddress = sale.Branch?.Address,
            BranchPhone = sale.Branch?.Phone,
            CashierName = $"{sale.User.FirstName} {sale.User.LastName}",
            Subtotal = sale.Subtotal,
            DiscountAmount = sale.DiscountAmount,
            TaxAmount = sale.TaxAmount,
            Total = sale.Total,
            PaymentMethod = sale.PaymentMethod.ToString(),
            IsRefunded = sale.IsRefunded,
            RefundedAt = sale.RefundedAt,
            CreatedAt = sale.CreatedAt,
            Items = sale.SaleItems.Select(si => new VerifiedSaleItemDto
            {
                ProductName = si.Product?.Name ?? "Product",
                Quantity = si.Quantity,
                UnitPrice = si.UnitPrice,
                Total = si.Total
            }).ToList()
        };

        return Ok(dto);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPost("{id}/refund")]
    public async Task<IActionResult> RefundSale(Guid id)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "owner@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var sale = await _context.Sales
                .IgnoreQueryFilters()
                .Include(s => s.SaleItems)
                .FirstOrDefaultAsync(s => s.Id == id && s.BusinessId == tenantId.Value);

            if (sale == null)
            {
                return NotFound(new { Message = "Sale not found." });
            }

            if (sale.IsRefunded)
            {
                return BadRequest(new { Message = "Sale has already been refunded." });
            }

            // Mark as refunded
            sale.IsRefunded = true;
            sale.RefundedAt = DateTime.UtcNow;

            // Restore stocks
            foreach (var item in sale.SaleItems)
            {
                ProductStock stock = null;
                if (sale.BranchId.HasValue)
                {
                    stock = await _context.ProductStocks
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(ps => ps.ProductId == item.ProductId && ps.BranchId == sale.BranchId.Value);
                }
                else
                {
                    stock = await _context.ProductStocks
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(ps => ps.ProductId == item.ProductId && ps.BranchId == null);
                }

                if (stock != null)
                {
                    var prevStockQty = stock.Quantity;
                    stock.Quantity += item.Quantity;
                    _context.ProductStocks.Update(stock);

                    // Log stock adjustment
                    var adjustmentLog = new StockAdjustmentLog
                    {
                        ProductId = item.ProductId,
                        BranchId = sale.BranchId,
                        PreviousQuantity = prevStockQty,
                        NewQuantity = stock.Quantity,
                        AdjustedByUserId = currentUserId,
                        Reason = $"Refund of Sale (Receipt ID: {sale.Id})"
                    };
                    _context.StockAdjustmentLogs.Add(adjustmentLog);

                    // Log audit log for stock change
                    await _auditLogService.LogAsync(
                        "StockAdjusted",
                        $"Restored {item.Quantity} items of product {item.ProductId} to stock due to sale {sale.Id} refund.",
                        userEmail,
                        tenantId.Value,
                        ip
                    );
                }
            }

            _context.Sales.Update(sale);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Log refund audit entry
            await _auditLogService.LogAsync(
                "SaleRefunded",
                $"Refunded sale {sale.Id} for total {sale.Total:F2}. Restored stock for {sale.SaleItems.Count} products.",
                userEmail,
                tenantId.Value,
                ip
            );

            return Ok(new { Message = "Transaction refunded successfully.", SaleId = sale.Id });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { Message = "Failed to process refund.", Details = ex.Message });
        }
    }
}
