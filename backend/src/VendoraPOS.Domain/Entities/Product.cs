using System;
using System.Collections.Generic;

namespace VendoraPOS.Domain.Entities;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal CostPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid BusinessId { get; set; }
    public Guid? CategoryId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Business Business { get; set; } = null!;
    public virtual Category? Category { get; set; }
    public virtual ICollection<ProductStock> ProductStocks { get; set; } = new List<ProductStock>();
    public virtual ICollection<StockAdjustmentLog> StockAdjustmentLogs { get; set; } = new List<StockAdjustmentLog>();
}
