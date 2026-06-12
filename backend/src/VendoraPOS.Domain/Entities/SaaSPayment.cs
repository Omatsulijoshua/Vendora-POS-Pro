using System;

namespace VendoraPOS.Domain.Entities;

public class SaaSPayment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PlanName { get; set; } = string.Empty; // "Starter", "Pro", "Enterprise"
    public int DurationMonths { get; set; } // 1, 3, 6, 12
    public string PaymentMethod { get; set; } = string.Empty; // "OPay" or "Manual"
    public string PaymentStatus { get; set; } = "Pending"; // "Pending", "Approved", "Rejected"
    public string? ReceiptUrl { get; set; } // Path to receipt image upload for manual payments
    public string? Reference { get; set; } // Bank sender name / transaction reference
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
}
