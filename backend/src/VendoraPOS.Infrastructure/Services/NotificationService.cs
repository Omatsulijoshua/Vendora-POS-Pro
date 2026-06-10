using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public NotificationService(ApplicationDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task SendNotificationAsync(Guid? businessId, Guid? branchId, string recipientEmail, string type, string channel, string title, string message)
    {
        // 1. Create and save notification entity
        var notification = new Notification
        {
            BusinessId = businessId,
            BranchId = branchId,
            RecipientEmail = recipientEmail,
            Title = title,
            Message = message,
            Type = type,
            Channel = channel,
            IsRead = false,
            SentAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // 2. Simulate transmission in Console
        if (channel.Equals("Email", StringComparison.OrdinalIgnoreCase))
        {
            Console.WriteLine($"[EMAIL SIMULATION] To: {recipientEmail} | Subject: {title} | Body: {message}");
        }
        else if (channel.Equals("SMS", StringComparison.OrdinalIgnoreCase))
        {
            Console.WriteLine($"[SMS SIMULATION] To: {recipientEmail} | Message: {message}");
        }

        // 3. Write an audit log entry for accountability
        await _auditLogService.LogAsync(
            action: $"{type}AlertSent",
            details: $"Sent notification alert ({channel}) to {recipientEmail}. Title: '{title}'",
            userEmail: "system@vendorapos.com",
            businessId: businessId
        );
    }

    public async Task CheckAndTriggerLowStockAlertAsync(Guid productId, Guid branchId)
    {
        // Fetch the product first to determine if it is in shared stock mode
        var product = await _context.Products
            .IgnoreQueryFilters()
            .Include(p => p.Business)
                .ThenInclude(b => b!.Owner)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null || product.Business == null) return;

        bool isSharedStock = product.Business.SharedStockMode;
        Guid? queryBranchId = isSharedStock ? null : branchId;

        var stock = await _context.ProductStocks
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(ps => ps.ProductId == productId && ps.BranchId == queryBranchId);

        if (stock == null) return;

        // If the quantity drops to or below the minimum stock level, trigger alert
        if (stock.Quantity <= stock.MinStockLevel)
        {
            var business = product.Business;
            var branch = await _context.Branches
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(b => b.Id == branchId);

            if (!isSharedStock && branch == null) return;

            string title = $"Low Stock Alert: {product.Name}";
            string locationName = isSharedStock ? "Shared Inventory" : $"branch '{branch?.Name}'";
            string message = $"Product '{product.Name}' (SKU: {product.SKU}) in {locationName} is low on stock. Current quantity: {stock.Quantity}, Min Stock Level: {stock.MinStockLevel}.";

            // 1. Notify Business Owner
            if (business.Owner != null && !string.IsNullOrEmpty(business.Owner.Email))
            {
                await SendNotificationAsync(
                    businessId: business.Id,
                    branchId: isSharedStock ? null : branchId,
                    recipientEmail: business.Owner.Email,
                    type: "LowStock",
                    channel: "Email",
                    title: title,
                    message: message
                );
            }

            // 2. Notify Branch Managers (if normal branch-isolated stock mode)
            if (!isSharedStock)
            {
                var managerRole = await _context.Roles
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(r => r.Name == "Manager");

                if (managerRole != null)
                {
                    var managerEmails = await _context.Users
                        .IgnoreQueryFilters()
                        .Where(u => u.BranchId == branchId && _context.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == managerRole.Id))
                        .Select(u => u.Email)
                        .ToListAsync();

                    foreach (var email in managerEmails.Where(e => !string.IsNullOrEmpty(e)))
                    {
                        await SendNotificationAsync(
                            businessId: business.Id,
                            branchId: branchId,
                            recipientEmail: email!,
                            type: "LowStock",
                            channel: "Email",
                            title: title,
                            message: message
                        );
                    }
                }
            }
        }
    }

    public async Task CheckAndTriggerSubscriptionRemindersAsync()
    {
        var scanThreshold = DateTime.UtcNow.AddDays(30);

        // Fetch all active businesses with subscription expiring in <= 30 days
        var expiringBusinesses = await _context.Businesses
            .IgnoreQueryFilters()
            .Include(b => b.Owner)
            .Where(b => b.SubscriptionStatus == "Active" && b.SubscriptionExpiresAt <= scanThreshold)
            .ToListAsync();

        foreach (var business in expiringBusinesses)
        {
            if (business.Owner == null || string.IsNullOrEmpty(business.Owner.Email))
                continue;

            var ownerEmail = business.Owner.Email;
            var expiryDate = business.SubscriptionExpiresAt;

            // Prevent spam: Check if a SubscriptionReminder was sent in the last 7 days to this owner
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
            var alreadySent = await _context.Notifications
                .IgnoreQueryFilters()
                .AnyAsync(n => n.RecipientEmail == ownerEmail && 
                               n.Type == "SubscriptionReminder" && 
                               n.SentAt >= sevenDaysAgo);

            if (alreadySent) continue;

            string title = "Subscription Expiry Reminder";
            string message = $"Your subscription plan '{business.SubscriptionTier}' for business '{business.Name}' expires on {expiryDate:yyyy-MM-dd}. Please renew soon to avoid service disruption.";

            await SendNotificationAsync(
                businessId: business.Id,
                branchId: null,
                recipientEmail: ownerEmail,
                type: "SubscriptionReminder",
                channel: "Email",
                title: title,
                message: message
            );
        }
    }
}
