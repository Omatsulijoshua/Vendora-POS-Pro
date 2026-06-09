using System.ComponentModel.DataAnnotations;

namespace VendoraPOS.Application.Models.Auth;

public class RegisterOwnerDto
{
    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string BusinessName { get; set; } = string.Empty;

    [Required]
    public string Subdomain { get; set; } = string.Empty;
}
