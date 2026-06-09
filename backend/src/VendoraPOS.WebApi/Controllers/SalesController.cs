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

[Authorize(Roles = "Owner,Manager,Cashier")]
[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public SalesController(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

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
            if (dto.DiscountAmount > 50.00m)
            {
                return BadRequest(new { Message = "Cashiers cannot apply a discount exceeding $50.00." });
            }
            if (tempSubtotal > 0 && (dto.DiscountAmount / tempSubtotal) > 0.15m)
            {
                return BadRequest(new { Message = "Cashiers cannot apply a discount exceeding 15%." });
            }
        }

        if (coupon != null && coupon.MinCartAmount.HasValue && tempSubtotal < coupon.MinCartAmount.Value)
        {
            return BadRequest(new { Message = $"Minimum cart spend of ${coupon.MinCartAmount.Value:F2} is required to apply this coupon." });
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
    public async Task<IActionResult> GetSales()
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var activeBranchId = _tenantProvider.BranchId;

        // Managers and Cashiers are restricted to their branch sales
        if (userRole == "Manager" || userRole == "Cashier")
        {
            var branchIdClaim = User.FindFirst("branch_id")?.Value;
            if (string.IsNullOrEmpty(branchIdClaim) || !Guid.TryParse(branchIdClaim, out var userBranchId))
            {
                return BadRequest(new { Message = "User branch context not found." });
            }
            activeBranchId = userBranchId;
        }

        var query = _context.Sales
            .IgnoreQueryFilters()
            .Include(s => s.User)
            .Include(s => s.Branch)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Product)
            .Where(s => s.BusinessId == tenantId.Value);

        if (activeBranchId.HasValue)
        {
            query = query.Where(s => s.BranchId == activeBranchId.Value);
        }

        var sales = await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SaleDto
            {
                Id = s.Id,
                BranchId = s.BranchId,
                BranchName = s.Branch != null ? s.Branch.Name : "Global/Shared",
                CashierId = s.UserId,
                CashierName = $"{s.User.FirstName} {s.User.LastName}",
                Subtotal = s.Subtotal,
                DiscountAmount = s.DiscountAmount,
                TaxAmount = s.TaxAmount,
                Total = s.Total,
                PaymentMethod = s.PaymentMethod.ToString(),
                PaymentDetails = s.PaymentDetails,
                AppliedCouponId = s.AppliedCouponId,
                AppliedCouponCode = s.AppliedCouponCode,
                CreatedAt = s.CreatedAt,
                Items = s.SaleItems.Select(si => new SaleItemDto
                {
                    Id = si.Id,
                    ProductId = si.ProductId,
                    ProductName = si.Product.Name,
                    SKU = si.Product.SKU,
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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSale(Guid id)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var activeBranchId = _tenantProvider.BranchId;

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
            .Include(s => s.User)
            .Include(s => s.Branch)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Product)
            .FirstOrDefaultAsync(s => s.Id == id && s.BusinessId == tenantId.Value);

        if (sale == null) return NotFound();

        // Access scope check
        if (activeBranchId.HasValue && sale.BranchId != activeBranchId.Value)
        {
            return Forbid();
        }

        var dto = new SaleDto
        {
            Id = sale.Id,
            BranchId = sale.BranchId,
            BranchName = sale.Branch != null ? sale.Branch.Name : "Global/Shared",
            CashierId = sale.UserId,
            CashierName = $"{sale.User.FirstName} {sale.User.LastName}",
            Subtotal = sale.Subtotal,
            DiscountAmount = sale.DiscountAmount,
            TaxAmount = sale.TaxAmount,
            Total = sale.Total,
            PaymentMethod = sale.PaymentMethod.ToString(),
            PaymentDetails = sale.PaymentDetails,
            AppliedCouponId = sale.AppliedCouponId,
            AppliedCouponCode = sale.AppliedCouponCode,
            CreatedAt = sale.CreatedAt,
            Items = sale.SaleItems.Select(si => new SaleItemDto
            {
                Id = si.Id,
                ProductId = si.ProductId,
                ProductName = si.Product.Name,
                SKU = si.Product.SKU,
                Quantity = si.Quantity,
                UnitPrice = si.UnitPrice,
                CostPrice = si.CostPrice,
                DiscountAmount = si.DiscountAmount,
                Total = si.Total
            }).ToList()
        };

        return Ok(dto);
    }
}
