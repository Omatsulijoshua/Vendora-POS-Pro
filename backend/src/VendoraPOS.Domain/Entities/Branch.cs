using System;
using System.Collections.Generic;

namespace VendoraPOS.Domain.Entities;

public class Branch
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BusinessId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Business Business { get; set; } = null!;
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
