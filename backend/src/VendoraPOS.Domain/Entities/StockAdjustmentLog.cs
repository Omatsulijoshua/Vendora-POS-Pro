using System;

namespace VendoraPOS.Domain.Entities;

public class StockAdjustmentLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid? BranchId { get; set; } // Null if SharedStockMode
    public int PreviousQuantity { get; set; }
    public int NewQuantity { get; set; }
    public Guid AdjustedByUserId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual Branch? Branch { get; set; }
    public virtual User AdjustedByUser { get; set; } = null!;
}
