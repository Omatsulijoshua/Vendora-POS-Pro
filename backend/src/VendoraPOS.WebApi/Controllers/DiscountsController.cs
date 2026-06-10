using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Application.Models.Promo;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DiscountsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly IAuditLogService _auditLogService;

    public DiscountsController(
        ApplicationDbContext context, 
        ITenantProvider tenantProvider,
        IAuditLogService auditLogService)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDiscounts([FromQuery] bool activeOnly = false)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var query = _context.Discounts
            .IgnoreQueryFilters()
            .Include(d => d.Product)
            .Where(d => d.BusinessId == tenantId.Value);

        if (activeOnly)
        {
            var now = DateTime.UtcNow;
            query = query.Where(d => d.IsActive && d.StartDate <= now && d.EndDate >= now);
        }

        var discounts = await query
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new DiscountDto
            {
                Id = d.Id,
                Name = d.Name,
                Description = d.Description,
                Type = d.Type.ToString(),
                Value = d.Value,
                Target = d.Target.ToString(),
                ProductId = d.ProductId,
                ProductName = d.Product != null ? d.Product.Name : null,
                MinCartAmount = d.MinCartAmount,
                StartDate = d.StartDate,
                EndDate = d.EndDate,
                IsActive = d.IsActive
            })
            .ToListAsync();

        return Ok(discounts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDiscount(Guid id)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var discount = await _context.Discounts
            .IgnoreQueryFilters()
            .Include(d => d.Product)
            .FirstOrDefaultAsync(d => d.Id == id && d.BusinessId == tenantId.Value);

        if (discount == null) return NotFound();

        var dto = new DiscountDto
        {
            Id = discount.Id,
            Name = discount.Name,
            Description = discount.Description,
            Type = discount.Type.ToString(),
            Value = discount.Value,
            Target = discount.Target.ToString(),
            ProductId = discount.ProductId,
            ProductName = discount.Product != null ? discount.Product.Name : null,
            MinCartAmount = discount.MinCartAmount,
            StartDate = discount.StartDate,
            EndDate = discount.EndDate,
            IsActive = discount.IsActive
        };

        return Ok(dto);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> CreateDiscount([FromBody] CreateDiscountDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        if (!Enum.TryParse<DiscountType>(dto.Type, true, out var discountType))
        {
            return BadRequest(new { Message = "Invalid discount type." });
        }

        if (!Enum.TryParse<DiscountTarget>(dto.Target, true, out var discountTarget))
        {
            return BadRequest(new { Message = "Invalid discount target." });
        }

        if (discountTarget == DiscountTarget.Product && !dto.ProductId.HasValue)
        {
            return BadRequest(new { Message = "Product selection is required for product target discounts." });
        }

        var discount = new Discount
        {
            BusinessId = tenantId.Value,
            Name = dto.Name,
            Description = dto.Description,
            Type = discountType,
            Value = dto.Value,
            Target = discountTarget,
            ProductId = discountTarget == DiscountTarget.Product ? dto.ProductId : null,
            MinCartAmount = discountTarget == DiscountTarget.Cart ? dto.MinCartAmount : null,
            StartDate = dto.StartDate.ToUniversalTime(),
            EndDate = dto.EndDate.ToUniversalTime(),
            IsActive = dto.IsActive
        };

        _context.Discounts.Add(discount);
        await _context.SaveChangesAsync();

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "user@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await _auditLogService.LogAsync(
            "DiscountCreated",
            $"Created discount '{discount.Name}' ({discount.Type}: {discount.Value}) target: {discount.Target}.",
            userEmail,
            tenantId.Value,
            ip
        );

        var product = discount.ProductId.HasValue
            ? await _context.Products.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == discount.ProductId.Value)
            : null;

        var resultDto = new DiscountDto
        {
            Id = discount.Id,
            Name = discount.Name,
            Description = discount.Description,
            Type = discount.Type.ToString(),
            Value = discount.Value,
            Target = discount.Target.ToString(),
            ProductId = discount.ProductId,
            ProductName = product?.Name,
            MinCartAmount = discount.MinCartAmount,
            StartDate = discount.StartDate,
            EndDate = discount.EndDate,
            IsActive = discount.IsActive
        };

        return CreatedAtAction(nameof(GetDiscount), new { id = discount.Id }, resultDto);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDiscount(Guid id, [FromBody] CreateDiscountDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var discount = await _context.Discounts
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.Id == id && d.BusinessId == tenantId.Value);

        if (discount == null) return NotFound();

        if (!Enum.TryParse<DiscountType>(dto.Type, true, out var discountType))
        {
            return BadRequest(new { Message = "Invalid discount type." });
        }

        if (!Enum.TryParse<DiscountTarget>(dto.Target, true, out var discountTarget))
        {
            return BadRequest(new { Message = "Invalid discount target." });
        }

        if (discountTarget == DiscountTarget.Product && !dto.ProductId.HasValue)
        {
            return BadRequest(new { Message = "Product selection is required for product target discounts." });
        }

        discount.Name = dto.Name;
        discount.Description = dto.Description;
        discount.Type = discountType;
        discount.Value = dto.Value;
        discount.Target = discountTarget;
        discount.ProductId = discountTarget == DiscountTarget.Product ? dto.ProductId : null;
        discount.MinCartAmount = discountTarget == DiscountTarget.Cart ? dto.MinCartAmount : null;
        discount.StartDate = dto.StartDate.ToUniversalTime();
        discount.EndDate = dto.EndDate.ToUniversalTime();
        discount.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "user@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await _auditLogService.LogAsync(
            "DiscountUpdated",
            $"Updated discount '{discount.Name}' ({discount.Type}: {discount.Value}) target: {discount.Target}.",
            userEmail,
            tenantId.Value,
            ip
        );

        return NoContent();
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDiscount(Guid id)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var discount = await _context.Discounts
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.Id == id && d.BusinessId == tenantId.Value);

        if (discount == null) return NotFound();

        _context.Discounts.Remove(discount);
        await _context.SaveChangesAsync();

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "user@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await _auditLogService.LogAsync(
            "DiscountDeleted",
            $"Deleted discount '{discount.Name}' ({discount.Type}: {discount.Value}).",
            userEmail,
            tenantId.Value,
            ip
        );

        return NoContent();
    }
}
