using System;
using System.Collections.Generic;

namespace VendoraPOS.Application.Models.Sales;

public class VerifiedSaleDto
{
    public Guid SaleId { get; set; }
    public string BusinessName { get; set; } = null!;
    public string BranchName { get; set; } = null!;
    public string? BranchAddress { get; set; }
    public string? BranchPhone { get; set; }
    public string CashierName { get; set; } = null!;
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public List<VerifiedSaleItemDto> Items { get; set; } = new();
}

public class VerifiedSaleItemDto
{
    public string ProductName { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
}
