using System;
using System.Collections.Generic;

namespace VendoraPOS.Application.Models.Products;

public class ProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal CostPrice { get; set; }
    public bool IsActive { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int TotalStock { get; set; }
    public bool UnderStockAlert { get; set; }
    public List<BranchStockDto> BranchStocks { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class BranchStockDto
{
    public Guid? BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int MinStockLevel { get; set; }
    public bool UnderStockAlert { get; set; }
}
