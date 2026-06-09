using System;

namespace VendoraPOS.Application.Models.Promo;

public class CreateCouponDto
{
    public string Code { get; set; } = null!;
    public string Type { get; set; } = "Percentage"; // "Percentage" or "FixedAmount"
    public decimal Value { get; set; }
    public decimal? MinCartAmount { get; set; }
    public int? UsageLimit { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
}
