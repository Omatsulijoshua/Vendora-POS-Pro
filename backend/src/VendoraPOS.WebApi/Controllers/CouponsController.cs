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
public class CouponsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly IAuditLogService _auditLogService;

    public CouponsController(
        ApplicationDbContext context, 
        ITenantProvider tenantProvider,
        IAuditLogService auditLogService)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _auditLogService = auditLogService;
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpGet]
    public async Task<IActionResult> GetCoupons()
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var coupons = await _context.Coupons
            .IgnoreQueryFilters()
            .Where(c => c.BusinessId == tenantId.Value)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CouponDto
            {
                Id = c.Id,
                Code = c.Code,
                Type = c.Type.ToString(),
                Value = c.Value,
                MinCartAmount = c.MinCartAmount,
                UsageLimit = c.UsageLimit,
                UsageCount = c.UsageCount,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                IsActive = c.IsActive
            })
            .ToListAsync();

        return Ok(coupons);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCoupon(Guid id)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var coupon = await _context.Coupons
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == id && c.BusinessId == tenantId.Value);

        if (coupon == null) return NotFound();

        var dto = new CouponDto
        {
            Id = coupon.Id,
            Code = coupon.Code,
            Type = coupon.Type.ToString(),
            Value = coupon.Value,
            MinCartAmount = coupon.MinCartAmount,
            UsageLimit = coupon.UsageLimit,
            UsageCount = coupon.UsageCount,
            StartDate = coupon.StartDate,
            EndDate = coupon.EndDate,
            IsActive = coupon.IsActive
        };

        return Ok(dto);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> CreateCoupon([FromBody] CreateCouponDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        if (!Enum.TryParse<DiscountType>(dto.Type, true, out var discountType))
        {
            return BadRequest(new { Message = "Invalid coupon discount type." });
        }

        var codeUpper = dto.Code.Trim().ToUpper();

        // Check uniqueness for the tenant
        var exists = await _context.Coupons
            .IgnoreQueryFilters()
            .AnyAsync(c => c.BusinessId == tenantId.Value && c.Code == codeUpper);

        if (exists)
        {
            return BadRequest(new { Message = $"Coupon code '{codeUpper}' already exists." });
        }

        var coupon = new Coupon
        {
            BusinessId = tenantId.Value,
            Code = codeUpper,
            Type = discountType,
            Value = dto.Value,
            MinCartAmount = dto.MinCartAmount,
            UsageLimit = dto.UsageLimit,
            StartDate = dto.StartDate.ToUniversalTime(),
            EndDate = dto.EndDate.ToUniversalTime(),
            IsActive = dto.IsActive
        };

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync();

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "user@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await _auditLogService.LogAsync(
            "CouponCreated",
            $"Created coupon '{coupon.Code}' ({coupon.Type}: {coupon.Value}).",
            userEmail,
            tenantId.Value,
            ip
        );

        var resultDto = new CouponDto
        {
            Id = coupon.Id,
            Code = coupon.Code,
            Type = coupon.Type.ToString(),
            Value = coupon.Value,
            MinCartAmount = coupon.MinCartAmount,
            UsageLimit = coupon.UsageLimit,
            UsageCount = coupon.UsageCount,
            StartDate = coupon.StartDate,
            EndDate = coupon.EndDate,
            IsActive = coupon.IsActive
        };

        return CreatedAtAction(nameof(GetCoupon), new { id = coupon.Id }, resultDto);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCoupon(Guid id, [FromBody] CreateCouponDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var coupon = await _context.Coupons
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == id && c.BusinessId == tenantId.Value);

        if (coupon == null) return NotFound();

        if (!Enum.TryParse<DiscountType>(dto.Type, true, out var discountType))
        {
            return BadRequest(new { Message = "Invalid coupon discount type." });
        }

        var codeUpper = dto.Code.Trim().ToUpper();

        // Verify uniqueness if code changed
        if (coupon.Code != codeUpper)
        {
            var exists = await _context.Coupons
                .IgnoreQueryFilters()
                .AnyAsync(c => c.BusinessId == tenantId.Value && c.Code == codeUpper);

            if (exists)
            {
                return BadRequest(new { Message = $"Coupon code '{codeUpper}' already exists." });
            }
        }

        coupon.Code = codeUpper;
        coupon.Type = discountType;
        coupon.Value = dto.Value;
        coupon.MinCartAmount = dto.MinCartAmount;
        coupon.UsageLimit = dto.UsageLimit;
        coupon.StartDate = dto.StartDate.ToUniversalTime();
        coupon.EndDate = dto.EndDate.ToUniversalTime();
        coupon.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "user@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await _auditLogService.LogAsync(
            "CouponUpdated",
            $"Updated coupon '{coupon.Code}' ({coupon.Type}: {coupon.Value}).",
            userEmail,
            tenantId.Value,
            ip
        );

        return NoContent();
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCoupon(Guid id)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var coupon = await _context.Coupons
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == id && c.BusinessId == tenantId.Value);

        if (coupon == null) return NotFound();

        _context.Coupons.Remove(coupon);
        await _context.SaveChangesAsync();

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "user@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await _auditLogService.LogAsync(
            "CouponDeleted",
            $"Deleted coupon '{coupon.Code}' ({coupon.Type}: {coupon.Value}).",
            userEmail,
            tenantId.Value,
            ip
        );

        return NoContent();
    }

    [HttpGet("validate/{code}")]
    public async Task<IActionResult> ValidateCoupon(string code, [FromQuery] decimal cartTotal = 0)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var codeUpper = code.Trim().ToUpper();

        var coupon = await _context.Coupons
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.BusinessId == tenantId.Value && c.Code == codeUpper);

        if (coupon == null)
        {
            return Ok(new ValidateCouponResultDto
            {
                IsValid = false,
                Message = $"Coupon '{codeUpper}' not found."
            });
        }

        if (!coupon.IsActive)
        {
            return Ok(new ValidateCouponResultDto
            {
                IsValid = false,
                Message = "This coupon code is currently inactive."
            });
        }

        var now = DateTime.UtcNow;
        if (coupon.StartDate > now)
        {
            return Ok(new ValidateCouponResultDto
            {
                IsValid = false,
                Message = "This coupon promotion has not started yet."
            });
        }

        if (coupon.EndDate < now)
        {
            return Ok(new ValidateCouponResultDto
            {
                IsValid = false,
                Message = "This coupon code has expired."
            });
        }

        if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value)
        {
            return Ok(new ValidateCouponResultDto
            {
                IsValid = false,
                Message = "This coupon code usage limit has been exceeded."
            });
        }

        if (coupon.MinCartAmount.HasValue && cartTotal < coupon.MinCartAmount.Value)
        {
            return Ok(new ValidateCouponResultDto
            {
                IsValid = false,
                Message = $"Minimum cart spend of ${coupon.MinCartAmount.Value:F2} is required to apply this coupon."
            });
        }

        return Ok(new ValidateCouponResultDto
        {
            IsValid = true,
            Type = coupon.Type.ToString(),
            Value = coupon.Value,
            Message = "Coupon applied successfully!"
        });
    }
}
