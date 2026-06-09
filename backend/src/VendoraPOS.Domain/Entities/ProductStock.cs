using System;

namespace VendoraPOS.Domain.Entities;

public class ProductStock
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid? BranchId { get; set; } // Null if SharedStockMode
    public int Quantity { get; set; }
    public int MinStockLevel { get; set; }

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual Branch? Branch { get; set; }
}
