using System;
using System.Threading.Tasks;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _context;

    public AuditLogService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(string action, string details, string userEmail, Guid? businessId = null, string ipAddress = "")
    {
        var log = new AuditLog
        {
            Action = action,
            Details = details,
            UserEmail = userEmail,
            BusinessId = businessId,
            IpAddress = ipAddress ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
