using System.ComponentModel.DataAnnotations;

namespace VendoraPOS.Application.Models.Categories;

public class UpdateCategoryDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
}
