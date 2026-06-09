using System;

namespace VendoraPOS.Domain.Entities;

public class ReceiptSetting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BusinessId { get; set; }
    public Guid? BranchId { get; set; } // Null if it represents the business default settings
    public string? LogoUrl { get; set; }
    public string? HeaderText { get; set; }
    public string? FooterText { get; set; }
    public bool ShowLogo { get; set; } = true;
    public bool ShowBranchDetails { get; set; } = true;
    public bool ShowCashierInfo { get; set; } = true;
    public bool ShowQRCode { get; set; } = true;
    public string ReceiptLayout { get; set; } = "Thermal"; // "Thermal" or "A4"
    public string? CustomBrandingColor { get; set; } // hex color for A4 borders/headers (e.g. #6366F1)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual Business Business { get; set; } = null!;
    public virtual Branch? Branch { get; set; }
}
