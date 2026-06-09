using System;
using System.Collections.Generic;

namespace VendoraPOS.Domain.Entities;

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid BusinessId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Business Business { get; set; } = null!;
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
