using System;

namespace VendoraPOS.Domain.Entities;

public enum TransferStatus
{
    Pending,
    Approved,
    Rejected,
    Cancelled
}

public class StockTransfer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BusinessId { get; set; }
    public Guid ProductId { get; set; }
    public Guid SourceBranchId { get; set; }
    public Guid TargetBranchId { get; set; }
    public int Quantity { get; set; }
    public TransferStatus Status { get; set; } = TransferStatus.Pending;
    public Guid InitiatedByUserId { get; set; }
    public Guid? ResolvedByUserId { get; set; }
    public string? Notes { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public virtual Business Business { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
    public virtual Branch SourceBranch { get; set; } = null!;
    public virtual Branch TargetBranch { get; set; } = null!;
    public virtual User InitiatedByUser { get; set; } = null!;
    public virtual User? ResolvedByUser { get; set; }
}
