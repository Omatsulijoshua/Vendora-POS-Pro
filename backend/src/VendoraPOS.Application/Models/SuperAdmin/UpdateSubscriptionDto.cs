using System;

namespace VendoraPOS.Application.Models.SuperAdmin;

public class UpdateSubscriptionDto
{
    public string SubscriptionTier { get; set; } = "Pro";
    public string SubscriptionStatus { get; set; } = "Active";
    public decimal SubscriptionPrice { get; set; } = 299.00m;
    public DateTime? SubscriptionExpiresAt { get; set; }
}
