using System;
using System.ComponentModel.DataAnnotations;

namespace VendoraPOS.Application.Models.Products;

public class AdjustStockDto
{
    public Guid? BranchId { get; set; } // Null if SharedStockMode

    [Range(0, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(0, int.MaxValue)]
    public int MinStockLevel { get; set; }

    [Required]
    [MaxLength(250)]
    public string Reason { get; set; } = string.Empty;
}
