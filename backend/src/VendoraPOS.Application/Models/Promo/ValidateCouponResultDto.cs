namespace VendoraPOS.Application.Models.Promo;

public class ValidateCouponResultDto
{
    public bool IsValid { get; set; }
    public string? Type { get; set; } // "Percentage" or "FixedAmount"
    public decimal Value { get; set; }
    public string Message { get; set; } = null!;
}
