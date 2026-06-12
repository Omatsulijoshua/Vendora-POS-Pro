using System;

namespace VendoraPOS.Application.Models.Auth;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid? BusinessId { get; set; }
    public Guid? BranchId { get; set; }
    public bool IsSubscriptionActive { get; set; } = true;
    public bool IsApproved { get; set; } = true;
    public bool IsBusinessActive { get; set; } = true;
}
