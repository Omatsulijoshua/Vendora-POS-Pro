using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize(Roles = "Owner,Manager")]
[ApiController]
[Route("api/audit-logs")]
public class AuditLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public AuditLogsController(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditLogs()
    {
        var businessId = _tenantProvider.TenantId;
        if (!businessId.HasValue)
        {
            return BadRequest(new { Message = "No active business context selected." });
        }

        var logs = await _context.AuditLogs
            .AsNoTracking()
            .Where(al => al.BusinessId == businessId.Value)
            .OrderByDescending(al => al.CreatedAt)
            .Take(100)
            .Select(al => new
            {
                al.Id,
                al.Action,
                al.Details,
                ActorEmail = al.UserEmail,
                al.IpAddress,
                Timestamp = al.CreatedAt
            })
            .ToListAsync();

        return Ok(logs);
    }
}
