using System;
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
            CreatedAt = DateTime.UtcNow
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
}
