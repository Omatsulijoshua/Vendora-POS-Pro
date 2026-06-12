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
        var activeBusinesses = businesses.Count(b => b.IsActive && b.IsApproved);
        var suspendedBusinesses = businesses.Count(b => !b.IsActive && b.IsApproved);
        var pendingApproval = businesses.Count(b => !b.IsApproved);

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
            PendingApprovalBusinesses = pendingApproval,
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
                IsApproved = b.IsApproved,
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

        if (business.IsActive && business.IsApproved)
        {
            return BadRequest(new { Message = "Business is already active." });
        }

        business.IsActive = true;
        business.IsApproved = true;
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

    [HttpPost("businesses/{id}/approve")]
    public async Task<IActionResult> ApproveBusiness(Guid id)
    {
        var business = await _context.Businesses.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == id);
        if (business == null)
        {
            return NotFound(new { Message = "Business not found." });
        }

        if (business.IsApproved)
        {
            return BadRequest(new { Message = "Business is already approved." });
        }

        business.IsApproved = true;
        business.IsActive = true; // Automatically activate upon approval
        await _context.SaveChangesAsync();

        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        await _auditLogService.LogAsync(
            "BusinessApproved",
            $"Approved business: {business.Name} (subdomain: {business.Subdomain})",
            adminEmail,
            id,
            ip
        );

        return Ok(new { Message = "Business approved successfully." });
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

    [HttpGet("branches")]
    public async Task<IActionResult> GetBranches([FromQuery] Guid? businessId = null)
    {
        var query = _context.Branches.IgnoreQueryFilters().AsNoTracking();
        if (businessId.HasValue)
        {
            query = query.Where(b => b.BusinessId == businessId.Value);
        }
        var branches = await query
            .OrderBy(b => b.Name)
            .Select(b => new { b.Id, b.Name, b.BusinessId })
            .ToListAsync();
        return Ok(branches);
    }

    [HttpGet("cashiers")]
    public async Task<IActionResult> GetCashiers([FromQuery] Guid? businessId = null, [FromQuery] Guid? branchId = null)
    {
        var query = _context.Users.IgnoreQueryFilters().AsNoTracking();
        if (businessId.HasValue)
        {
            query = query.Where(u => u.BusinessId == businessId.Value);
        }
        if (branchId.HasValue)
        {
            query = query.Where(u => u.BranchId == branchId.Value);
        }

        var users = await query.ToListAsync();
        var cashierList = new List<object>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? string.Empty;

            if (role == "Cashier" || role == "Manager")
            {
                cashierList.Add(new
                {
                    Id = user.Id,
                    Name = $"{user.FirstName} {user.LastName}",
                    Email = user.Email,
                    Role = role,
                    BusinessId = user.BusinessId,
                    BranchId = user.BranchId
                });
            }
        }

        return Ok(cashierList);
    }

    [HttpGet("payment-settings")]
    public async Task<IActionResult> GetPaymentSettings()
    {
        var settings = await _context.SaaSPaymentSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new SaaSPaymentSetting
            {
                BankName = "Opay Microfinance bank",
                AccountName = "Joshua Toritseju Omatsul",
                AccountNumber = "6110540847",
                OPayFeesPercent = 1.5m
            };
            _context.SaaSPaymentSettings.Add(settings);
            await _context.SaveChangesAsync();
        }
        return Ok(settings);
    }

    [HttpPut("payment-settings")]
    public async Task<IActionResult> UpdatePaymentSettings([FromBody] SaaSPaymentSetting model)
    {
        var settings = await _context.SaaSPaymentSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new SaaSPaymentSetting();
            _context.SaaSPaymentSettings.Add(settings);
        }

        settings.BankName = model.BankName;
        settings.AccountName = model.AccountName;
        settings.AccountNumber = model.AccountNumber;
        settings.OPayFeesPercent = model.OPayFeesPercent;
        settings.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        await _auditLogService.LogAsync(
            "SaaSPaymentSettingsUpdated",
            $"Updated SaaS manual payment bank settings: Bank={model.BankName}, Account={model.AccountName}, AccountNo={model.AccountNumber}, OPayFee={model.OPayFeesPercent}%",
            adminEmail,
            null,
            ip
        );

        return Ok(settings);
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments()
    {
        var payments = await _context.SaaSPayments
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var businesses = await _context.Businesses
            .IgnoreQueryFilters()
            .ToListAsync();

        var users = await _userManager.Users
            .IgnoreQueryFilters()
            .ToListAsync();

        var result = payments.Select(p => {
            var biz = businesses.FirstOrDefault(b => b.Id == p.BusinessId);
            var owner = biz != null ? users.FirstOrDefault(u => u.Id == biz.OwnerId) : null;
            return new
            {
                p.Id,
                p.BusinessId,
                p.BusinessName,
                p.Amount,
                p.PlanName,
                p.DurationMonths,
                p.PaymentMethod,
                p.PaymentStatus,
                p.ReceiptUrl,
                p.Reference,
                p.CreatedAt,
                p.ProcessedAt,
                OwnerEmail = owner?.Email
            };
        }).ToList();

        return Ok(result);
    }

    [HttpPost("payments/{id}/approve")]
    public async Task<IActionResult> ApprovePayment(Guid id)
    {
        var payment = await _context.SaaSPayments.FirstOrDefaultAsync(p => p.Id == id);
        if (payment == null)
        {
            return NotFound(new { Message = "Payment not found." });
        }

        if (payment.PaymentStatus != "Pending")
        {
            return BadRequest(new { Message = "Only pending payments can be approved." });
        }

        var business = await _context.Businesses.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == payment.BusinessId);
        if (business == null)
        {
            return NotFound(new { Message = "Business tenant not found." });
        }

        payment.PaymentStatus = "Approved";
        payment.ProcessedAt = DateTime.UtcNow;

        // Update business subscription
        business.SubscriptionTier = payment.PlanName;
        business.SubscriptionStatus = "Active";
        
        decimal monthlyRate = payment.PlanName.ToLowerInvariant() switch
        {
            "starter" => 15000m,
            "pro" => 50000m,
            "enterprise" => 150000m,
            _ => 50000m
        };
        business.SubscriptionPrice = monthlyRate * 12;

        DateTime currentExpires = business.SubscriptionExpiresAt ?? DateTime.UtcNow;
        if (currentExpires < DateTime.UtcNow)
        {
            currentExpires = DateTime.UtcNow;
        }
        business.SubscriptionExpiresAt = currentExpires.AddMonths(payment.DurationMonths);

        // Audit Trail
        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        await _auditLogService.LogAsync(
            "SaaSPaymentApproved",
            $"Approved manual payment (Id: {payment.Id}) of ₦{payment.Amount:N2} for {business.Name}. Expanded subscription by {payment.DurationMonths} months.",
            adminEmail,
            payment.BusinessId,
            ip
        );

        await _context.SaveChangesAsync();

        return Ok(new { Message = "Payment approved and subscription extended successfully." });
    }

    [HttpPost("payments/{id}/reject")]
    public async Task<IActionResult> RejectPayment(Guid id)
    {
        var payment = await _context.SaaSPayments.FirstOrDefaultAsync(p => p.Id == id);
        if (payment == null)
        {
            return NotFound(new { Message = "Payment not found." });
        }

        if (payment.PaymentStatus != "Pending")
        {
            return BadRequest(new { Message = "Only pending payments can be rejected." });
        }

        payment.PaymentStatus = "Rejected";
        payment.ProcessedAt = DateTime.UtcNow;

        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        await _auditLogService.LogAsync(
            "SaaSPaymentRejected",
            $"Rejected manual payment (Id: {payment.Id}) of ₦{payment.Amount:N2} for Business Id {payment.BusinessId}.",
            adminEmail,
            payment.BusinessId,
            ip
        );

        await _context.SaveChangesAsync();

        return Ok(new { Message = "Payment rejected successfully." });
    }

    [HttpPost("send-broadcast")]
    public async Task<IActionResult> SendBroadcast([FromBody] SendBroadcastRequest request)
    {
        if (string.IsNullOrEmpty(request.Title) || string.IsNullOrEmpty(request.Message))
        {
            return BadRequest(new { Message = "Title and Message are required." });
        }

        // Determine target roles
        var targetRoles = new List<string>();
        if (request.TargetAudience.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            targetRoles.Add("Owner");
            targetRoles.Add("Manager");
            targetRoles.Add("Cashier");
        }
        else if (request.TargetAudience.Equals("Admins", StringComparison.OrdinalIgnoreCase))
        {
            targetRoles.Add("Owner");
        }
        else if (request.TargetAudience.Equals("Managers", StringComparison.OrdinalIgnoreCase))
        {
            targetRoles.Add("Manager");
        }
        else
        {
            return BadRequest(new { Message = "Invalid target audience. Choose All, Admins, or Managers." });
        }

        // Fetch target users based on roles
        var targetUsers = await _context.Users
            .IgnoreQueryFilters()
            .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id && 
                _context.Roles.Any(r => r.Id == ur.RoleId && targetRoles.Contains(r.Name))))
            .ToListAsync();

        var notifications = new List<Notification>();
        foreach (var u in targetUsers)
        {
            notifications.Add(new Notification
            {
                BusinessId = u.BusinessId,
                BranchId = u.BranchId,
                RecipientEmail = u.Email ?? string.Empty,
                Title = request.Title,
                Message = request.Message,
                Type = "General",
                Channel = "In-App",
                IsRead = false,
                SentAt = DateTime.UtcNow
            });
        }

        if (notifications.Any())
        {
            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();
        }

        // Log audit log
        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await _auditLogService.LogAsync(
            "BroadcastNotificationSent",
            $"Sent broadcast notification ({request.TargetAudience}): Title='{request.Title}', Message='{request.Message}' to {targetUsers.Count} users",
            adminEmail,
            null,
            ip
        );

        return Ok(new { Message = $"Broadcast sent successfully to {targetUsers.Count} users." });
    }

    [HttpPost("clear-test-data")]
    public async Task<IActionResult> ClearTestData()
    {
        // Get all non-admin user IDs
        var superAdminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "SuperAdmin");
        var superAdminUserIds = superAdminRole != null
            ? await _context.UserRoles.Where(ur => ur.RoleId == superAdminRole.Id).Select(ur => ur.UserId).ToListAsync()
            : new List<Guid>();

        var nonAdminUsers = await _context.Users
            .IgnoreQueryFilters()
            .Where(u => !superAdminUserIds.Contains(u.Id))
            .ToListAsync();

        // 1. Break the circular dependency cycle. Null out User references to Branches and Businesses first.
        foreach (var u in nonAdminUsers)
        {
            u.BranchId = null;
            u.BusinessId = null;
        }
        await _context.SaveChangesAsync();

        // 2. Clear out all dependent child tables
        _context.StockAdjustmentLogs.RemoveRange(await _context.StockAdjustmentLogs.IgnoreQueryFilters().ToListAsync());
        _context.StockTransfers.RemoveRange(await _context.StockTransfers.IgnoreQueryFilters().ToListAsync());
        _context.SaleItems.RemoveRange(await _context.SaleItems.IgnoreQueryFilters().ToListAsync());
        _context.Sales.RemoveRange(await _context.Sales.IgnoreQueryFilters().ToListAsync());
        _context.Discounts.RemoveRange(await _context.Discounts.IgnoreQueryFilters().ToListAsync());
        _context.Coupons.RemoveRange(await _context.Coupons.IgnoreQueryFilters().ToListAsync());
        _context.ReceiptSettings.RemoveRange(await _context.ReceiptSettings.IgnoreQueryFilters().ToListAsync());
        _context.ProductStocks.RemoveRange(await _context.ProductStocks.IgnoreQueryFilters().ToListAsync());
        _context.Products.RemoveRange(await _context.Products.IgnoreQueryFilters().ToListAsync());
        _context.Categories.RemoveRange(await _context.Categories.IgnoreQueryFilters().ToListAsync());
        _context.Branches.RemoveRange(await _context.Branches.IgnoreQueryFilters().ToListAsync());
        await _context.SaveChangesAsync();

        // 3. Clear businesses (this deletes business records, breaking OwnerId -> User dependencies since users are still alive)
        _context.Businesses.RemoveRange(await _context.Businesses.IgnoreQueryFilters().ToListAsync());
        await _context.SaveChangesAsync();

        // 4. Clear non-admin users
        _context.Users.RemoveRange(nonAdminUsers);
        await _context.SaveChangesAsync();

        // 5. Clear payments & notifications
        _context.SaaSPayments.RemoveRange(await _context.SaaSPayments.IgnoreQueryFilters().ToListAsync());
        _context.Notifications.RemoveRange(await _context.Notifications.IgnoreQueryFilters().ToListAsync());

        // 6. Remove audit logs except super-admin audit logs
        var nonAdminAuditLogs = await _context.AuditLogs
            .IgnoreQueryFilters()
            .Where(al => al.BusinessId != null)
            .ToListAsync();
        _context.AuditLogs.RemoveRange(nonAdminAuditLogs);

        await _context.SaveChangesAsync();

        // Log audit log for accountability
        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@vendorapos.com";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await _auditLogService.LogAsync(
            "SystemDataCleared",
            "Cleared all test business tenants, transaction records, products, branches, and non-admin user accounts from the database.",
            adminEmail,
            null,
            ip
        );

        return Ok(new { Message = "All test and mock data has been deleted from the database successfully." });
    }
}

public class SendBroadcastRequest
{
    public string TargetAudience { get; set; } = string.Empty; // "All", "Admins", "Managers"
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
