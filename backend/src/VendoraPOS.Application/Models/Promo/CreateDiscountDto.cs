using System;

namespace VendoraPOS.Application.Models.Promo;

public class CreateDiscountDto
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Type { get; set; } = "Percentage"; // "Percentage" or "FixedAmount"
    public decimal Value { get; set; }
    public string Target { get; set; } = "Product"; // "Product" or "Cart"
    public Guid? ProductId { get; set; }
    public decimal? MinCartAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
}
