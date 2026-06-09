using System;

namespace VendoraPOS.Application.Models.Transfers;

public class StockTransferDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public Guid SourceBranchId { get; set; }
    public string SourceBranchName { get; set; } = string.Empty;
    public Guid TargetBranchId { get; set; }
    public string TargetBranchName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Status { get; set; } = string.Empty; // e.g. "Pending", "Approved", "Rejected", "Cancelled"
    public Guid InitiatedByUserId { get; set; }
    public string InitiatedByUserName { get; set; } = string.Empty;
    public Guid? ResolvedByUserId { get; set; }
    public string? ResolvedByUserName { get; set; }
    public string? Notes { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
