using System;

namespace VendoraPOS.Application.Models.Staff;

public class StaffDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid? BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
