using System;
using System.Collections.Generic;

namespace VendoraPOS.Domain.Entities;

public class Sale
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BusinessId { get; set; }
    public Guid? BranchId { get; set; } // Null if SharedStockMode is active
    public Guid UserId { get; set; } // Cashier / Manager who completed the sale
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string? PaymentDetails { get; set; } // JSON metadata for mixed payments
    public Guid? AppliedCouponId { get; set; }
    public string? AppliedCouponCode { get; set; }
    public bool IsRefunded { get; set; } = false;
    public DateTime? RefundedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Business Business { get; set; } = null!;
    public virtual Branch? Branch { get; set; }
    public virtual User User { get; set; } = null!;
    public virtual ICollection<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
}
