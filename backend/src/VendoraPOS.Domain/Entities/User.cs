using System;
using Microsoft.AspNetCore.Identity;

namespace VendoraPOS.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    
    public Guid? BusinessId { get; set; }
    public Guid? BranchId { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Business? Business { get; set; }
    public virtual Branch? Branch { get; set; }
}
