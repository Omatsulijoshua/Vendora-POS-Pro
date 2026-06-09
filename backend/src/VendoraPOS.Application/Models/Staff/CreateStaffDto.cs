using System;
using System.ComponentModel.DataAnnotations;

namespace VendoraPOS.Application.Models.Staff;

public class CreateStaffDto
{
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(Manager|Cashier)$", ErrorMessage = "Role must be either 'Manager' or 'Cashier'.")]
    public string Role { get; set; } = string.Empty;

    [Required]
    public Guid BranchId { get; set; }
}
