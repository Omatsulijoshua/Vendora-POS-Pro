using System;

namespace VendoraPOS.Application.Models.Receipts;

public class ReceiptSettingDto
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = null!;
    public Guid? BranchId { get; set; }
    public string? LogoUrl { get; set; }
    public string? HeaderText { get; set; }
    public string? FooterText { get; set; }
    public bool ShowLogo { get; set; }
    public bool ShowBranchDetails { get; set; }
    public bool ShowCashierInfo { get; set; }
    public bool ShowQRCode { get; set; }
    public string ReceiptLayout { get; set; } = "Thermal";
    public string? CustomBrandingColor { get; set; }
}
