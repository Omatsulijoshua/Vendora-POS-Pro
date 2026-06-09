using System.ComponentModel.DataAnnotations;

namespace VendoraPOS.Application.Models.Categories;

public class CreateCategoryDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
}
