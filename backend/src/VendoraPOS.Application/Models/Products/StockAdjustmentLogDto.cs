using System;

namespace VendoraPOS.Application.Models.Products;

public class StockAdjustmentLogDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public Guid? BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public int PreviousQuantity { get; set; }
    public int NewQuantity { get; set; }
    public Guid AdjustedByUserId { get; set; }
    public string AdjustedByUserName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
