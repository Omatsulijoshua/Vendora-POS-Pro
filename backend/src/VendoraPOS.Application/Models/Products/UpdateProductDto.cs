using System;
using System.ComponentModel.DataAnnotations;

namespace VendoraPOS.Application.Models.Products;

public class UpdateProductDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string SKU { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Barcode { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [Range(0, double.MaxValue)]
    public decimal CostPrice { get; set; }

    public Guid? CategoryId { get; set; }
}
