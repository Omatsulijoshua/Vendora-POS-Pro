using System;

namespace VendoraPOS.Domain.Entities;

public class SaleItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SaleId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; } // Captured at time of sale
    public decimal DiscountAmount { get; set; }
    public decimal Total { get; set; }

    public virtual Sale Sale { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
}
