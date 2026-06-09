using System;

namespace VendoraPOS.Application.Models.Promo;

public class CouponDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public string Type { get; set; } = null!;
    public decimal Value { get; set; }
    public decimal? MinCartAmount { get; set; }
    public int? UsageLimit { get; set; }
    public int UsageCount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
}
