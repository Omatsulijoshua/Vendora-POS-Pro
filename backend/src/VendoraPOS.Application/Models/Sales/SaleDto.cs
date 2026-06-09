using System;
using System.Collections.Generic;

namespace VendoraPOS.Application.Models.Sales;

public class SaleDto
{
    public Guid Id { get; set; }
    public Guid? BranchId { get; set; }
    public string? BranchName { get; set; }
    public Guid CashierId { get; set; }
    public string CashierName { get; set; } = null!;
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public string? PaymentDetails { get; set; }
    public Guid? AppliedCouponId { get; set; }
    public string? AppliedCouponCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<SaleItemDto> Items { get; set; } = new();
}
