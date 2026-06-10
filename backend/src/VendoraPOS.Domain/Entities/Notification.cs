using System;

namespace VendoraPOS.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? BusinessId { get; set; }
    public Guid? BranchId { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "LowStock", "SubscriptionReminder", "General"
    public string Channel { get; set; } = string.Empty; // "Email", "SMS"
    public bool IsRead { get; set; } = false;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }

    // Navigation properties
    public Business? Business { get; set; }
    public Branch? Branch { get; set; }
}
