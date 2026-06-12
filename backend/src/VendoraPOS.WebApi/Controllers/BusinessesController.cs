using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Models.Businesses;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Domain.Enums;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize(Roles = "Owner")]
[ApiController]
[Route("api/[controller]")]
public class BusinessesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;

    public BusinessesController(ApplicationDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("my-businesses")]
    public async Task<IActionResult> GetMyBusinesses()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var businesses = await _context.Businesses
            .Where(b => b.OwnerId == userId)
            .OrderBy(b => b.CreatedAt)
            .Select(b => new BusinessDto
            {
                Id = b.Id,
                Name = b.Name,
                Subdomain = b.Subdomain,
                IsActive = b.IsActive,
                SharedStockMode = b.SharedStockMode,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(businesses);
    }

    [HttpPost]
    public async Task<IActionResult> CreateBusiness([FromBody] CreateBusinessDto model)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Retrieve existing businesses owned by this owner
        var existingBusinesses = await _context.Businesses
            .IgnoreQueryFilters()
            .Where(b => b.OwnerId == userId)
            .ToListAsync();

        if (existingBusinesses.Count >= 1)
        {
            var hasStarter = existingBusinesses.Any(b => string.Equals(b.SubscriptionTier, "Starter", StringComparison.OrdinalIgnoreCase));
            if (hasStarter)
            {
                return BadRequest(new { Message = "You currently have a business on the Starter plan, which is limited to 1 business account. Please upgrade your existing business plan to create multiple businesses." });
            }
        }

        // Check if subdomain is taken globally
        var subdomainExists = await _context.Businesses
            .IgnoreQueryFilters()
            .AnyAsync(b => b.Subdomain.ToLower() == model.Subdomain.ToLower());

        if (subdomainExists)
        {
            return BadRequest(new { Message = "Subdomain is already taken." });
        }

        // Create Business
        var business = new Business
        {
            Name = model.Name,
            Subdomain = model.Subdomain.ToLower(),
            OwnerId = userId,
            IsActive = true,
            SharedStockMode = false,
            CreatedAt = DateTime.UtcNow,
            SubscriptionStatus = "Inactive",
            SubscriptionExpiresAt = DateTime.UtcNow
        };

        _context.Businesses.Add(business);
        await _context.SaveChangesAsync();

        // If user currently does not have an active BusinessId set, set it to the new one
        var user = await _userManager.FindByIdAsync(userIdClaim);
        if (user != null && user.BusinessId == null)
        {
            user.BusinessId = business.Id;
            await _userManager.UpdateAsync(user);
        }

        var resultDto = new BusinessDto
        {
            Id = business.Id,
            Name = business.Name,
            Subdomain = business.Subdomain,
            IsActive = business.IsActive,
            SharedStockMode = business.SharedStockMode,
            CreatedAt = business.CreatedAt
        };

        return CreatedAtAction(nameof(GetMyBusinesses), new { id = business.Id }, resultDto);
    }

    [HttpPut("toggle-shared-stock")]
    public async Task<IActionResult> ToggleSharedStock()
    {
        var businessIdClaim = User.FindFirst("business_id")?.Value;
        if (string.IsNullOrEmpty(businessIdClaim) || !Guid.TryParse(businessIdClaim, out var businessId))
        {
            return BadRequest(new { Message = "No active business context selected." });
        }

        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.Id == businessId);
        if (business == null)
        {
            return NotFound(new { Message = "Business not found." });
        }

        business.SharedStockMode = !business.SharedStockMode;

        // If switching to Shared stock, ensure there's a ProductStock record with BranchId = null for all products.
        // If switching to Branch stock, ensure there's a ProductStock record for all active branches.
        if (business.SharedStockMode)
        {
            var products = await _context.Products.Where(p => p.BusinessId == businessId).ToListAsync();
            foreach (var product in products)
            {
                var sharedStockExists = await _context.ProductStocks.AnyAsync(ps => ps.ProductId == product.Id && ps.BranchId == null);
                if (!sharedStockExists)
                {
                    var sumQty = await _context.ProductStocks.Where(ps => ps.ProductId == product.Id && ps.BranchId != null).SumAsync(ps => ps.Quantity);
                    var maxMin = await _context.ProductStocks.Where(ps => ps.ProductId == product.Id && ps.BranchId != null).MaxAsync(ps => (int?)ps.MinStockLevel) ?? 0;
                    
                    _context.ProductStocks.Add(new ProductStock
                    {
                        ProductId = product.Id,
                        BranchId = null,
                        Quantity = sumQty,
                        MinStockLevel = maxMin
                    });
                }
            }
        }
        else
        {
            var products = await _context.Products.Where(p => p.BusinessId == businessId).ToListAsync();
            var branches = await _context.Branches.IgnoreQueryFilters().Where(b => b.BusinessId == businessId).ToListAsync();
            foreach (var product in products)
            {
                var globalStock = await _context.ProductStocks.FirstOrDefaultAsync(ps => ps.ProductId == product.Id && ps.BranchId == null);
                var globalQty = globalStock?.Quantity ?? 0;
                var globalMin = globalStock?.MinStockLevel ?? 0;

                foreach (var branch in branches)
                {
                    var branchStockExists = await _context.ProductStocks.AnyAsync(ps => ps.ProductId == product.Id && ps.BranchId == branch.Id);
                    if (!branchStockExists)
                    {
                        _context.ProductStocks.Add(new ProductStock
                        {
                            ProductId = product.Id,
                            BranchId = branch.Id,
                            Quantity = globalQty / Math.Max(1, branches.Count),
                            MinStockLevel = globalMin
                        });
                    }
                }
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new { Id = business.Id, SharedStockMode = business.SharedStockMode });
    }

    [HttpGet("owner-stats")]
    public async Task<IActionResult> GetOwnerStats([FromQuery] Guid? businessId = null)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Get all businesses owned by this owner
        var ownedBusinesses = await _context.Businesses
            .IgnoreQueryFilters()
            .Where(b => b.OwnerId == userId)
            .ToListAsync();

        var businessIds = ownedBusinesses.Select(b => b.Id).ToList();

        // If no business owned, return empty stats
        if (businessIds.Count == 0)
        {
            return Ok(new OwnerDashboardStatsDto());
        }

        // Determine active business context filter:
        Guid? activeBusinessId = null;
        if (businessId.HasValue && businessIds.Contains(businessId.Value))
        {
            activeBusinessId = businessId.Value;
        }
        else
        {
            var businessClaim = User.FindFirst("business_id")?.Value;
            if (!string.IsNullOrEmpty(businessClaim) && Guid.TryParse(businessClaim, out var bId) && businessIds.Contains(bId))
            {
                activeBusinessId = bId;
            }
        }

        // Fetch all sales, branches and staff across all owned businesses by ignoring query filters
        var allSales = await _context.Sales
            .IgnoreQueryFilters()
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Product)
            .Include(s => s.User)
            .Where(s => businessIds.Contains(s.BusinessId))
            .ToListAsync();

        var allBranches = await _context.Branches
            .IgnoreQueryFilters()
            .Where(b => businessIds.Contains(b.BusinessId))
            .ToListAsync();

        var allStaff = await _context.Users
            .IgnoreQueryFilters()
            .Where(u => u.BusinessId.HasValue && businessIds.Contains(u.BusinessId.Value))
            .ToListAsync();

        // Calculate consolidated KPIs (filtered by activeBusinessId if selected, otherwise consolidated over all owned businesses)
        var contextSales = activeBusinessId.HasValue 
            ? allSales.Where(s => s.BusinessId == activeBusinessId.Value).ToList() 
            : allSales;

        decimal totalRevenue = contextSales.Sum(s => s.Total);
        int totalSalesCount = contextSales.Count;
        decimal averageTransactionValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0m;

        decimal totalProfit = contextSales.Sum(s => 
            s.SaleItems.Sum(si => si.Total - (si.CostPrice * si.Quantity))
        );
        decimal profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0m;

        // Calculate Cross-Business Metrics (always returns all owned businesses)
        var businessMetrics = new List<BusinessMetricDto>();
        foreach (var b in ownedBusinesses)
        {
            var bSales = allSales.Where(s => s.BusinessId == b.Id).ToList();
            var bRev = bSales.Sum(s => s.Total);
            var bProf = bSales.Sum(s => s.SaleItems.Sum(si => si.Total - (si.CostPrice * si.Quantity)));
            var bBranchesCount = allBranches.Count(br => br.BusinessId == b.Id);

            businessMetrics.Add(new BusinessMetricDto
            {
                BusinessId = b.Id,
                BusinessName = b.Name,
                Revenue = bRev,
                Profit = bProf,
                SalesCount = bSales.Count,
                BranchesCount = bBranchesCount
            });
        }

        // Calculate Branch Metrics (only if activeBusinessId is selected)
        var branchMetrics = new List<BranchMetricDto>();
        if (activeBusinessId.HasValue)
        {
            var activeBranches = allBranches.Where(br => br.BusinessId == activeBusinessId.Value).ToList();
            foreach (var br in activeBranches)
            {
                var brSales = allSales.Where(s => s.BranchId == br.Id).ToList();
                var brRev = brSales.Sum(s => s.Total);
                var brProf = brSales.Sum(s => s.SaleItems.Sum(si => si.Total - (si.CostPrice * si.Quantity)));
                var brStaffCount = allStaff.Count(u => u.BranchId == br.Id);

                branchMetrics.Add(new BranchMetricDto
                {
                    BranchId = br.Id,
                    BranchName = br.Name,
                    Revenue = brRev,
                    Profit = brProf,
                    SalesCount = brSales.Count,
                    StaffCount = brStaffCount
                });
            }
        }

        // Calculate Top Products
        var topProducts = contextSales
            .SelectMany(s => s.SaleItems)
            .GroupBy(si => new { si.ProductId, si.Product.Name, si.Product.SKU })
            .Select(g => new OwnerTopProductDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.Name,
                SKU = g.Key.SKU,
                QuantitySold = g.Sum(si => si.Quantity),
                Revenue = g.Sum(si => si.Total),
                Profit = g.Sum(si => si.Total - (si.CostPrice * si.Quantity))
            })
            .OrderByDescending(tp => tp.QuantitySold)
            .Take(5)
            .ToList();

        // Calculate Top Cashiers
        var topCashiers = contextSales
            .GroupBy(s => s.UserId)
            .Select(g => {
                var userObj = allStaff.FirstOrDefault(u => u.Id == g.Key);
                var name = userObj != null ? $"{userObj.FirstName} {userObj.LastName}" : "Unknown Staff";
                var brObj = allBranches.FirstOrDefault(b => b.Id == userObj?.BranchId);
                var brName = brObj != null ? brObj.Name : "Unassigned";

                return new OwnerTopCashierDto
                {
                    UserId = g.Key,
                    CashierName = name,
                    BranchName = brName,
                    SalesCount = g.Count(),
                    Revenue = g.Sum(s => s.Total)
                };
            })
            .OrderByDescending(tc => tc.Revenue)
            .Take(5)
            .ToList();

        // Calculate 7-day trend
        var dailyTrend = new List<OwnerDailyTrendDto>();
        var todayLocal = DateTime.UtcNow.Date;
        for (int i = 6; i >= 0; i--)
        {
            var dateTarget = todayLocal.AddDays(-i);
            var dateStr = dateTarget.ToString("yyyy-MM-dd");
            var matches = contextSales.Where(s => s.CreatedAt.Date == dateTarget).ToList();
            var rev = matches.Sum(s => s.Total);
            var prof = matches.Sum(s => s.SaleItems.Sum(si => si.Total - (si.CostPrice * si.Quantity)));

            dailyTrend.Add(new OwnerDailyTrendDto
            {
                Date = dateStr,
                Revenue = rev,
                Profit = prof,
                SalesCount = matches.Count
            });
        }

        var dto = new OwnerDashboardStatsDto
        {
            TotalRevenue = totalRevenue,
            TotalProfit = totalProfit,
            TotalSalesCount = totalSalesCount,
            AverageTransactionValue = averageTransactionValue,
            ProfitMargin = profitMargin,
            BusinessMetrics = businessMetrics,
            BranchMetrics = branchMetrics,
            TopProducts = topProducts,
            TopCashiers = topCashiers,
            DailyTrend = dailyTrend
        };

        return Ok(dto);
    }
}
