using System;

namespace VendoraPOS.Application.Models.SuperAdmin;

public class SuperAdminAuditLogDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Guid? BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
}
