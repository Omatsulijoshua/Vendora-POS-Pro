using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Application.Models.SuperAdmin;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Domain.Enums;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize(Roles = "SuperAdmin")]
[ApiController]
[Route("api/[controller]")]
public class SuperAdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly IAuditLogService _auditLogService;

    public SuperAdminController(
        ApplicationDbContext context,
        UserManager<User> userManager,
        IAuditLogService auditLogService)
    {
        _context = context;
        _userManager = userManager;
        _auditLogService = auditLogService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var businesses = await _context.Businesses.IgnoreQueryFilters().AsNoTracking().ToListAsync();
        var branchesCount = await _context.Branches.IgnoreQueryFilters().CountAsync();
        var usersCount = await _context.Users.IgnoreQueryFilters().CountAsync();

        var totalBusinesses = businesses.Count;
        var activeBusinesses = businesses.Count(b => b.IsActive);
        var suspendedBusinesses = totalBusinesses - activeBusinesses;

        var activeSubs = businesses.Count(b => b.IsActive && b.SubscriptionStatus == "Active");
        var totalSaaSRevenue = businesses
            .Where(b => b.IsActive && b.SubscriptionStatus == "Active")
            .Sum(b => b.SubscriptionPrice);
        var monthlySaaSRevenue = totalSaaSRevenue / 12m;

        // 7-day business growth trend
        var trend = new List<SuperAdminDailyTrendDto>();
        var today = DateTime.UtcNow.Date;
        for (int i = 6; i >= 0; i--)
        {
            var dateTarget = today.AddDays(-i);
            var count = businesses.Count(b => b.CreatedAt.Date == dateTarget);
            trend.Add(new SuperAdminDailyTrendDto
            {
                Date = dateTarget.ToString("yyyy-MM-dd"),
                BusinessesCreated = count
            });
        }

        var dto = new SuperAdminDashboardStatsDto
        {
            TotalBusinesses = totalBusinesses,
            ActiveBusinesses = activeBusinesses,
            SuspendedBusinesses = suspendedBusinesses,
            ActiveSubscriptions = activeSubs,
            TotalSaaSRevenue = totalSaaSRevenue,
            MonthlySaaSRevenue = monthlySaaSRevenue,
            TotalBranches = branchesCount,
            TotalUsers = usersCount,
            BusinessGrowthTrend = trend
        };

        return Ok(dto);
    }

    [HttpGet("businesses")]
    public async Task<IActionResult> GetBusinesses()
    {
        var businesses = await _context.Businesses
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(b => b.Owner)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        var branches = await _context.Branches.IgnoreQueryFilters().AsNoTracking().ToListAsync();
        var staff = await _context.Users.IgnoreQueryFilters().AsNoTracking().ToListAsync();
        var sales = await _context.Sales.IgnoreQueryFilters().AsNoTracking().ToListAsync();

        var list = new List<SuperAdminBusinessDto>();
        foreach (var b in businesses)
        {
            var bBranchesCount = branches.Count(br => br.BusinessId == b.Id);
            var bUsersCount = staff.Count(u => u.BusinessId == b.Id);
            var bRevenue = sales.Where(s => s.BusinessId == b.Id).Sum(s => s.Total);

            list.Add(new SuperAdminBusinessDto
            {
                Id = b.Id,
                Name = b.Name,
                Subdomain = b.Subdomain,
                OwnerName = b.Owner != null ? $"{b.Owner.FirstName} {b.Owner.LastName}" : "Unknown",
                OwnerEmail = b.Owner?.Email ?? "Unknown",
                CreatedAt = b.CreatedAt,
                IsActive = b.IsActive,
                BranchesCount = bBranchesCount,
                UsersCount = bUsersCount,
                SubscriptionTier = b.SubscriptionTier,
                SubscriptionStatus = b.SubscriptionStatus,
                SubscriptionPrice = b.SubscriptionPrice,
                SubscriptionExpiresAt = b.SubscriptionExpiresAt,
                TotalSalesRevenue = bRevenue
            });
        }

        return Ok(list);
    }

    [HttpPost("businesses/{id}/suspend")]
    public async Task<IActionResult> SuspendBusiness(Guid id)
    {
        var business = await _context.Businesses.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == id);
        if (business == null)
        {
            return NotFound(new { Message = "Business not found." });
        }

        if (!business.IsActive)
        {
            return BadRequest(new { Message = "Business is already suspended." });
        }

        business.IsActive = false;
        await _context.SaveChangesAsync();

        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        await _auditLogService.LogAsync(
            "BusinessSuspended",
            $"Suspended business: {business.Name} (subdomain: {business.Subdomain})",
            adminEmail,
            id,
            ip
        );

        return Ok(new { Message = "Business suspended successfully." });
    }

    [HttpPost("businesses/{id}/activate")]
    public async Task<IActionResult> ActivateBusiness(Guid id)
    {
        var business = await _context.Businesses.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == id);
        if (business == null)
        {
            return NotFound(new { Message = "Business not found." });
        }

        if (business.IsActive)
        {
            return BadRequest(new { Message = "Business is already active." });
        }

        business.IsActive = true;
        await _context.SaveChangesAsync();

        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        await _auditLogService.LogAsync(
            "BusinessActivated",
            $"Activated business: {business.Name} (subdomain: {business.Subdomain})",
            adminEmail,
            id,
            ip
        );

        return Ok(new { Message = "Business activated successfully." });
    }

    [HttpPut("businesses/{id}/subscription")]
    public async Task<IActionResult> UpdateSubscription(Guid id, [FromBody] UpdateSubscriptionDto model)
    {
        var business = await _context.Businesses.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == id);
        if (business == null)
        {
            return NotFound(new { Message = "Business not found." });
        }

        business.SubscriptionTier = model.SubscriptionTier;
        business.SubscriptionStatus = model.SubscriptionStatus;
        business.SubscriptionPrice = model.SubscriptionPrice;
        business.SubscriptionExpiresAt = model.SubscriptionExpiresAt.HasValue
            ? DateTime.SpecifyKind(model.SubscriptionExpiresAt.Value, DateTimeKind.Utc)
            : null;

        await _context.SaveChangesAsync();

        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        await _auditLogService.LogAsync(
            "SubscriptionUpdated",
            $"Updated subscription for {business.Name}: Tier={model.SubscriptionTier}, Status={model.SubscriptionStatus}, Price={model.SubscriptionPrice}, Expires={model.SubscriptionExpiresAt}",
            adminEmail,
            id,
            ip
        );

        return Ok(new { Message = "Subscription updated successfully." });
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs()
    {
        var logs = await _context.AuditLogs
            .IgnoreQueryFilters()
            .AsNoTracking()
            .OrderByDescending(al => al.CreatedAt)
            .ToListAsync();

        var businesses = await _context.Businesses.IgnoreQueryFilters().AsNoTracking().ToListAsync();

        var dtoList = logs.Select(al => new SuperAdminAuditLogDto
        {
            Id = al.Id,
            Action = al.Action,
            Details = al.Details,
            UserEmail = al.UserEmail,
            IpAddress = al.IpAddress,
            CreatedAt = al.CreatedAt,
            BusinessId = al.BusinessId,
            BusinessName = al.BusinessId.HasValue 
                ? (businesses.FirstOrDefault(b => b.Id == al.BusinessId.Value)?.Name ?? "Deleted Business") 
                : "Platform / Global"
        }).ToList();

        return Ok(dtoList);
    }
}
