using System.ComponentModel.DataAnnotations;

namespace VendoraPOS.Application.Models.Staff;

public class ResetStaffPasswordDto
{
    [Required]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
    public string NewPassword { get; set; } = string.Empty;
}
