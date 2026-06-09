using System.Collections.Generic;

namespace VendoraPOS.Application.Models.Sales;

public class CreateSaleDto
{
    public string PaymentMethod { get; set; } = null!;
    public string? PaymentDetails { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public string? CouponCode { get; set; }
    public List<CreateSaleItemDto> Items { get; set; } = new();
}
