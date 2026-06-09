using System;

namespace VendoraPOS.Application.Models.Promo;

public class DiscountDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Type { get; set; } = null!;
    public decimal Value { get; set; }
    public string Target { get; set; } = null!;
    public Guid? ProductId { get; set; }
    public string? ProductName { get; set; }
    public decimal? MinCartAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
}
