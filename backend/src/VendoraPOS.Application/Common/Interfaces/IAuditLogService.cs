using System;
using System.Threading.Tasks;

namespace VendoraPOS.Application.Common.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(string action, string details, string userEmail, Guid? businessId = null, string ipAddress = "");
}
