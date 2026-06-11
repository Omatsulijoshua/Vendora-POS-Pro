using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Application.Models.Products;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly IAuditLogService _auditLogService;
    private readonly INotificationService _notificationService;

    public ProductsController(
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

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] string? search, [FromQuery] Guid? categoryId, [FromQuery] bool lowStockOnly = false)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        // Fetch business settings to know the stock mode
        var business = await _context.Businesses
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == tenantId.Value);

        if (business == null) return BadRequest("Business context not found.");

        var query = _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.ProductStocks)
            .Where(p => p.IsActive);

        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(searchLower) || 
                                     p.SKU.ToLower().Contains(searchLower) || 
                                     (p.Barcode != null && p.Barcode.ToLower().Contains(searchLower)));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        var activeBranchId = _tenantProvider.BranchId;

        // Apply low stock filter if requested
        if (lowStockOnly)
        {
            if (business.SharedStockMode)
            {
                query = query.Where(p => p.ProductStocks.Any(ps => ps.BranchId == null && ps.Quantity <= ps.MinStockLevel));
            }
            else if (activeBranchId.HasValue)
            {
                query = query.Where(p => p.ProductStocks.Any(ps => ps.BranchId == activeBranchId.Value && ps.Quantity <= ps.MinStockLevel));
            }
            else
            {
                // In global view, check if any branch is low on stock
                query = query.Where(p => p.ProductStocks.Any(ps => ps.BranchId != null && ps.Quantity <= ps.MinStockLevel));
            }
        }

        var productsList = await query.OrderBy(p => p.Name).ToListAsync();
        
        var dtos = productsList.Select(p =>
        {
            int totalStock = 0;
            bool underStockAlert = false;

            if (business.SharedStockMode)
            {
                var stock = p.ProductStocks.FirstOrDefault(ps => ps.BranchId == null);
                totalStock = stock?.Quantity ?? 0;
                underStockAlert = stock != null && totalStock <= stock.MinStockLevel;
            }
            else if (activeBranchId.HasValue)
            {
                var stock = p.ProductStocks.FirstOrDefault(ps => ps.BranchId == activeBranchId.Value);
                totalStock = stock?.Quantity ?? 0;
                underStockAlert = stock != null && totalStock <= stock.MinStockLevel;
            }
            else
            {
                // Global/consolidated view sum across all branches
                totalStock = p.ProductStocks.Where(ps => ps.BranchId != null).Sum(ps => ps.Quantity);
                
                // If any branch is under stock alert, set it to true for global warning
                underStockAlert = p.ProductStocks.Any(ps => ps.BranchId != null && ps.Quantity <= ps.MinStockLevel);
            }

            var dto = new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                SKU = p.SKU,
                Barcode = p.Barcode,
                Description = p.Description,
                Price = p.Price,
                CostPrice = p.CostPrice,
                IsActive = p.IsActive,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.Name,
                TotalStock = totalStock,
                UnderStockAlert = underStockAlert,
                CreatedAt = p.CreatedAt
            };

            // Include branch breakdowns if in global view (Owner only)
            if (!activeBranchId.HasValue)
            {
                dto.BranchStocks = p.ProductStocks.Select(ps => new BranchStockDto
                {
                    BranchId = ps.BranchId,
                    BranchName = ps.BranchId.HasValue ? (_context.Branches.IgnoreQueryFilters().FirstOrDefault(b => b.Id == ps.BranchId.Value)?.Name ?? "Unknown Branch") : "Global/Shared",
                    Quantity = ps.Quantity,
                    MinStockLevel = ps.MinStockLevel,
                    UnderStockAlert = ps.Quantity <= ps.MinStockLevel
                }).ToList();
            }

            return dto;
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProduct(Guid id)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        var business = await _context.Businesses
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == tenantId.Value);

        if (business == null) return BadRequest("Business context not found.");

        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.ProductStocks)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null) return NotFound();

        var activeBranchId = _tenantProvider.BranchId;
        int totalStock = 0;
        bool underStockAlert = false;

        if (business.SharedStockMode)
        {
            var stock = product.ProductStocks.FirstOrDefault(ps => ps.BranchId == null);
            totalStock = stock?.Quantity ?? 0;
            underStockAlert = stock != null && totalStock <= stock.MinStockLevel;
        }
        else if (activeBranchId.HasValue)
        {
            var stock = product.ProductStocks.FirstOrDefault(ps => ps.BranchId == activeBranchId.Value);
            totalStock = stock?.Quantity ?? 0;
            underStockAlert = stock != null && totalStock <= stock.MinStockLevel;
        }
        else
        {
            totalStock = product.ProductStocks.Where(ps => ps.BranchId != null).Sum(ps => ps.Quantity);
            underStockAlert = product.ProductStocks.Any(ps => ps.BranchId != null && ps.Quantity <= ps.MinStockLevel);
        }

        var dto = new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            SKU = product.SKU,
            Barcode = product.Barcode,
            Description = product.Description,
            Price = product.Price,
            CostPrice = product.CostPrice,
            IsActive = product.IsActive,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name,
            TotalStock = totalStock,
            UnderStockAlert = underStockAlert,
            CreatedAt = product.CreatedAt
        };

        if (!activeBranchId.HasValue)
        {
            dto.BranchStocks = product.ProductStocks.Select(ps => new BranchStockDto
            {
                BranchId = ps.BranchId,
                BranchName = ps.BranchId.HasValue ? (_context.Branches.IgnoreQueryFilters().FirstOrDefault(b => b.Id == ps.BranchId.Value)?.Name ?? "Unknown Branch") : "Global/Shared",
                Quantity = ps.Quantity,
                MinStockLevel = ps.MinStockLevel,
                UnderStockAlert = ps.Quantity <= ps.MinStockLevel
            }).ToList();
        }

        return Ok(dto);
    }

    [HttpGet("barcode/{barcode}")]
    public async Task<IActionResult> GetProductByBarcode(string barcode)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        var business = await _context.Businesses
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == tenantId.Value);

        if (business == null) return BadRequest("Business context not found.");

        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.ProductStocks)
            .FirstOrDefaultAsync(p => p.Barcode != null && p.Barcode.ToLower() == barcode.ToLower());

        if (product == null) return NotFound();

        var activeBranchId = _tenantProvider.BranchId;
        int totalStock = 0;
        bool underStockAlert = false;

        if (business.SharedStockMode)
        {
            var stock = product.ProductStocks.FirstOrDefault(ps => ps.BranchId == null);
            totalStock = stock?.Quantity ?? 0;
            underStockAlert = stock != null && totalStock <= stock.MinStockLevel;
        }
        else if (activeBranchId.HasValue)
        {
            var stock = product.ProductStocks.FirstOrDefault(ps => ps.BranchId == activeBranchId.Value);
            totalStock = stock?.Quantity ?? 0;
            underStockAlert = stock != null && totalStock <= stock.MinStockLevel;
        }
        else
        {
            totalStock = product.ProductStocks.Where(ps => ps.BranchId != null).Sum(ps => ps.Quantity);
            underStockAlert = product.ProductStocks.Any(ps => ps.BranchId != null && ps.Quantity <= ps.MinStockLevel);
        }

        var dto = new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            SKU = product.SKU,
            Barcode = product.Barcode,
            Description = product.Description,
            Price = product.Price,
            CostPrice = product.CostPrice,
            IsActive = product.IsActive,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name,
            TotalStock = totalStock,
            UnderStockAlert = underStockAlert,
            CreatedAt = product.CreatedAt
        };

        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        var business = await _context.Businesses
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(b => b.Id == tenantId.Value);

        if (business == null) return BadRequest("Business context not found.");

        // Check if SKU is unique in business
        var skuExists = await _context.Products.AnyAsync(p => p.SKU.ToLower() == dto.SKU.ToLower());
        if (skuExists) return BadRequest("SKU already exists for this business.");

        // Check if Barcode is unique in business (if provided)
        if (!string.IsNullOrEmpty(dto.Barcode))
        {
            var barcodeExists = await _context.Products.AnyAsync(p => p.Barcode != null && p.Barcode.ToLower() == dto.Barcode.ToLower());
            if (barcodeExists) return BadRequest("Barcode already exists for this business.");
        }

        // Validate Category (if provided)
        if (dto.CategoryId.HasValue)
        {
            var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId.Value);
            if (!categoryExists) return BadRequest("Selected category not found.");
        }

        var product = new Product
        {
            Name = dto.Name,
            SKU = dto.SKU,
            Barcode = dto.Barcode,
            Description = dto.Description,
            Price = dto.Price,
            CostPrice = dto.CostPrice,
            BusinessId = tenantId.Value,
            CategoryId = dto.CategoryId
        };

        _context.Products.Add(product);

        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());

        // Setup stock records based on SharedStockMode
        if (business.SharedStockMode)
        {
            var stockInfo = dto.InitialStocks?.FirstOrDefault(s => s.BranchId == null);
            var initialQty = stockInfo?.Quantity ?? 0;
            var initialMin = stockInfo?.MinStockLevel ?? 0;

            var stock = new ProductStock
            {
                ProductId = product.Id,
                BranchId = null,
                Quantity = initialQty,
                MinStockLevel = initialMin
            };
            _context.ProductStocks.Add(stock);

            // Log initial stock log
            if (initialQty > 0)
            {
                var log = new StockAdjustmentLog
                {
                    ProductId = product.Id,
                    BranchId = null,
                    PreviousQuantity = 0,
                    NewQuantity = initialQty,
                    AdjustedByUserId = currentUserId,
                    Reason = "Initial stock intake (Shared Mode)"
                };
                _context.StockAdjustmentLogs.Add(log);
            }
        }
        else
        {
            // Branch Stock Mode: Get all active branches in the business
            var branches = await _context.Branches.IgnoreQueryFilters().Where(b => b.BusinessId == tenantId.Value).ToListAsync();
            foreach (var branch in branches)
            {
                var stockInfo = dto.InitialStocks?.FirstOrDefault(s => s.BranchId == branch.Id);
                var initialQty = stockInfo?.Quantity ?? 0;
                var initialMin = stockInfo?.MinStockLevel ?? 0;

                var stock = new ProductStock
                {
                    ProductId = product.Id,
                    BranchId = branch.Id,
                    Quantity = initialQty,
                    MinStockLevel = initialMin
                };
                _context.ProductStocks.Add(stock);

                if (initialQty > 0)
                {
                    var log = new StockAdjustmentLog
                    {
                        ProductId = product.Id,
                        BranchId = branch.Id,
                        PreviousQuantity = 0,
                        NewQuantity = initialQty,
                        AdjustedByUserId = currentUserId,
                        Reason = $"Initial stock intake (Branch: {branch.Name})"
                    };
                    _context.StockAdjustmentLogs.Add(log);
                }
            }
        }

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            SKU = product.SKU,
            Barcode = product.Barcode,
            Description = product.Description,
            Price = product.Price,
            CostPrice = product.CostPrice,
            IsActive = product.IsActive,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name,
            TotalStock = dto.InitialStocks?.Sum(s => s.Quantity) ?? 0,
            CreatedAt = product.CreatedAt
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductDto dto)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return NotFound();

        // Check if SKU is unique
        var skuExists = await _context.Products.AnyAsync(p => p.Id != id && p.SKU.ToLower() == dto.SKU.ToLower());
        if (skuExists) return BadRequest("SKU already exists for this business.");

        // Check if Barcode is unique (if provided)
        if (!string.IsNullOrEmpty(dto.Barcode))
        {
            var barcodeExists = await _context.Products.AnyAsync(p => p.Id != id && p.Barcode != null && p.Barcode.ToLower() == dto.Barcode.ToLower());
            if (barcodeExists) return BadRequest("Barcode already exists for this business.");
        }

        // Validate Category (if provided)
        if (dto.CategoryId.HasValue)
        {
            var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId.Value);
            if (!categoryExists) return BadRequest("Selected category not found.");
        }

        product.Name = dto.Name;
        product.SKU = dto.SKU;
        product.Barcode = dto.Barcode;
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.CostPrice = dto.CostPrice;
        product.CategoryId = dto.CategoryId;

        await _context.SaveChangesAsync();

        return Ok(new { Message = "Product updated successfully." });
    }

    [HttpPut("{id}/adjust-stock")]
    public async Task<IActionResult> AdjustStock(Guid id, [FromBody] AdjustStockDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        var business = await _context.Businesses
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(b => b.Id == tenantId.Value);

        if (business == null) return BadRequest("Business context not found.");

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return NotFound();

        // Verify Roles & Permissions
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userRole == "Cashier")
        {
            return StatusCode(403, new { Message = "Cashiers are not allowed to adjust stock levels." });
        }

        if (userRole == "Manager")
        {
            var managerBranchIdClaim = User.FindFirst("branch_id")?.Value;
            if (string.IsNullOrEmpty(managerBranchIdClaim) || !Guid.TryParse(managerBranchIdClaim, out var managerBranchId))
            {
                return BadRequest("Manager does not have an assigned branch context.");
            }

            if (business.SharedStockMode)
            {
                return BadRequest("Shared stock adjustments are restricted to Business Owners.");
            }

            if (dto.BranchId != managerBranchId)
            {
                return StatusCode(403, new { Message = "Managers can only adjust stock levels for their assigned branch." });
            }
        }

        // Adjust Stock records
        ProductStock? stock = null;
        if (business.SharedStockMode)
        {
            stock = await _context.ProductStocks.FirstOrDefaultAsync(ps => ps.ProductId == id && ps.BranchId == null);
            if (stock == null)
            {
                stock = new ProductStock { ProductId = id, BranchId = null, Quantity = 0, MinStockLevel = 0 };
                _context.ProductStocks.Add(stock);
            }
        }
        else
        {
            if (!dto.BranchId.HasValue)
            {
                return BadRequest("Branch ID is required for stock adjustments in branch mode.");
            }

            // Verify branch belongs to the business
            var branchExists = await _context.Branches.IgnoreQueryFilters().AnyAsync(b => b.Id == dto.BranchId.Value && b.BusinessId == tenantId.Value);
            if (!branchExists) return BadRequest("Branch not found under this business.");

            stock = await _context.ProductStocks.FirstOrDefaultAsync(ps => ps.ProductId == id && ps.BranchId == dto.BranchId.Value);
            if (stock == null)
            {
                stock = new ProductStock { ProductId = id, BranchId = dto.BranchId.Value, Quantity = 0, MinStockLevel = 0 };
                _context.ProductStocks.Add(stock);
            }
        }

        int previousQty = stock.Quantity;
        stock.Quantity = dto.Quantity;
        stock.MinStockLevel = dto.MinStockLevel;

        // Add Log
        var log = new StockAdjustmentLog
        {
            ProductId = id,
            BranchId = business.SharedStockMode ? null : dto.BranchId,
            PreviousQuantity = previousQty,
            NewQuantity = dto.Quantity,
            AdjustedByUserId = currentUserId,
            Reason = dto.Reason
        };

        _context.StockAdjustmentLogs.Add(log);
        await _context.SaveChangesAsync();

        // Check for low stock alerts
        await _notificationService.CheckAndTriggerLowStockAlertAsync(id, dto.BranchId ?? Guid.Empty);

        // Audit Log
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "owner@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await _auditLogService.LogAsync(
            "StockAdjusted",
            $"Manually adjusted stock of '{product.Name}' (SKU: {product.SKU}) from {previousQty} to {dto.Quantity}. Reason: {dto.Reason ?? "Manual adjustment"}",
            userEmail,
            tenantId.Value,
            ip
        );

        return Ok(new { Message = "Stock level adjusted successfully.", PreviousQuantity = previousQty, NewQuantity = dto.Quantity });
    }

    [HttpGet("{id}/adjustment-logs")]
    public async Task<IActionResult> GetAdjustmentLogs(Guid id)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        // Verify product exists in tenant context
        var product = await _context.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return NotFound();

        var activeBranchId = _tenantProvider.BranchId;

        var query = _context.StockAdjustmentLogs
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(sal => sal.AdjustedByUser)
            .Include(sal => sal.Branch)
            .Where(sal => sal.ProductId == id && sal.Product.BusinessId == tenantId.Value);

        if (activeBranchId.HasValue)
        {
            query = query.Where(sal => sal.BranchId == null || sal.BranchId == activeBranchId.Value);
        }

        var logs = await query
            .OrderByDescending(sal => sal.CreatedAt)
            .Select(sal => new StockAdjustmentLogDto
            {
                Id = sal.Id,
                ProductId = sal.ProductId,
                ProductName = sal.Product.Name,
                BranchId = sal.BranchId,
                BranchName = sal.BranchId.HasValue && sal.Branch != null ? sal.Branch.Name : "Global/Shared",
                PreviousQuantity = sal.PreviousQuantity,
                NewQuantity = sal.NewQuantity,
                AdjustedByUserId = sal.AdjustedByUserId,
                AdjustedByUserName = sal.AdjustedByUser != null ? $"{sal.AdjustedByUser.FirstName} {sal.AdjustedByUser.LastName}" : "System",
                Reason = sal.Reason,
                CreatedAt = sal.CreatedAt
            })
            .ToListAsync();

        return Ok(logs);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return NotFound();

        // Soft delete
        product.IsActive = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
