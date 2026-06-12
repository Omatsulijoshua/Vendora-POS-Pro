using System;
using System.Collections.Generic;

namespace VendoraPOS.Domain.Entities;

public class Business
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsApproved { get; set; } = true;
    public bool SharedStockMode { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Subscription details
    public string SubscriptionTier { get; set; } = "Pro";
    public string SubscriptionStatus { get; set; } = "Active";
    public decimal SubscriptionPrice { get; set; } = 299.00m;
    public DateTime? SubscriptionExpiresAt { get; set; } = DateTime.UtcNow.AddYears(1);
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }

    // Navigation properties
    public virtual User Owner { get; set; } = null!;
    public virtual ICollection<Branch> Branches { get; set; } = new List<Branch>();
}
