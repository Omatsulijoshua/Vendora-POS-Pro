using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly INotificationService _notificationService;

    public NotificationsController(
        ApplicationDbContext context,
        ITenantProvider tenantProvider,
        INotificationService notificationService)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue)
        {
            return BadRequest(new { Message = "No active business context selected." });
        }

        var activeBranchId = _tenantProvider.BranchId;

        // Retrieve notifications for the active business.
        // If a branch is selected in user context (like for managers/cashiers),
        // only show global notifications (BranchId is null) or notifications matching their branch.
        var query = _context.Notifications
            .Where(n => n.BusinessId == tenantId.Value);

        if (activeBranchId.HasValue)
        {
            query = query.Where(n => n.BranchId == null || n.BranchId == activeBranchId.Value);
        }

        var notifications = await query
            .OrderByDescending(n => n.SentAt)
            .Take(100)
            .Select(n => new
            {
                n.Id,
                n.RecipientEmail,
                n.Title,
                n.Message,
                n.Type,
                n.Channel,
                n.IsRead,
                Timestamp = n.SentAt,
                n.ReadAt
            })
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue)
        {
            return BadRequest(new { Message = "No active business context selected." });
        }

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.BusinessId == tenantId.Value);

        if (notification == null)
        {
            return NotFound(new { Message = "Notification not found." });
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;

            _context.Notifications.Update(notification);
            await _context.SaveChangesAsync();
        }

        return Ok(new { Message = "Notification marked as read successfully." });
    }

    [Authorize(Roles = "Owner,SuperAdmin")]
    [HttpPost("check-subscription-reminders")]
    public async Task<IActionResult> CheckSubscriptionReminders()
    {
        await _notificationService.CheckAndTriggerSubscriptionRemindersAsync();
        return Ok(new { Message = "Subscription reminders check completed successfully." });
    }
}
