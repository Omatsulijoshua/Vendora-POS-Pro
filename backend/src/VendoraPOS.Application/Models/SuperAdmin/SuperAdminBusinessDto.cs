using System;

namespace VendoraPOS.Application.Models.SuperAdmin;

public class SuperAdminBusinessDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
    public bool IsApproved { get; set; }
    public int BranchesCount { get; set; }
    public int UsersCount { get; set; }
    public string SubscriptionTier { get; set; } = string.Empty;
    public string SubscriptionStatus { get; set; } = string.Empty;
    public decimal SubscriptionPrice { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
    public decimal TotalSalesRevenue { get; set; }
}
