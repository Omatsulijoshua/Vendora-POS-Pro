using System;

namespace VendoraPOS.Application.Models.Receipts;

public class UpdateReceiptSettingDto
{
    public Guid? BranchId { get; set; }
    public string? LogoUrl { get; set; }
    public string? HeaderText { get; set; }
    public string? FooterText { get; set; }
    public bool ShowLogo { get; set; } = true;
    public bool ShowBranchDetails { get; set; } = true;
    public bool ShowCashierInfo { get; set; } = true;
    public bool ShowQRCode { get; set; } = true;
    public string ReceiptLayout { get; set; } = "Thermal";
    public string? CustomBrandingColor { get; set; }
}
