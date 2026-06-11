using System;
using System.ComponentModel.DataAnnotations;

namespace VendoraPOS.Application.Models.Products;

public class AddStockDto
{
    public Guid? BranchId { get; set; } // Null if SharedStockMode

    [Range(1, int.MaxValue, ErrorMessage = "Quantity to add must be at least 1.")]
    public int QuantityToAdd { get; set; }

    [Required]
    [MaxLength(250)]
    public string Reason { get; set; } = string.Empty;
}
