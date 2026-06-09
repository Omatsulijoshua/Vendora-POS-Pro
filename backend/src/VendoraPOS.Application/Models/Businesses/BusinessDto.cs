using System;

namespace VendoraPOS.Application.Models.Businesses;

public class BusinessDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool SharedStockMode { get; set; }
    public DateTime CreatedAt { get; set; }
}
