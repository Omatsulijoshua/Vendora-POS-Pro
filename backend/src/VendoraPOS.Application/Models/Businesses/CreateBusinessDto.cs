using System.ComponentModel.DataAnnotations;

namespace VendoraPOS.Application.Models.Businesses;

public class CreateBusinessDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^[a-z0-9-]+$", ErrorMessage = "Subdomain can only contain lowercase letters, numbers, and hyphens.")]
    [StringLength(100, MinimumLength = 3)]
    public string Subdomain { get; set; } = string.Empty;
}
