using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize(Roles = "Owner")]
[ApiController]
[Route("api/[controller]")]
public class BillingController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly IWebHostEnvironment _env;

    public BillingController(
        ApplicationDbContext context,
        ITenantProvider tenantProvider,
        IWebHostEnvironment env)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _env = env;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var businessId = _tenantProvider.TenantId;
        if (!businessId.HasValue)
        {
            return BadRequest(new { Message = "Active business context is required." });
        }

        var business = await _context.Businesses
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(b => b.Id == businessId.Value);

        if (business == null)
        {
            return NotFound(new { Message = "Business not found." });
        }

        // Fetch or create default payment settings
        var settings = await _context.SaaSPaymentSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new SaaSPaymentSetting
            {
                BankName = "Opay Microfinance bank",
                AccountName = "Joshua Toritseju Omatsul",
                AccountNumber = "6110540847",
                OPayFeesPercent = 1.5m
            };
            _context.SaaSPaymentSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            business.Id,
            business.Name,
            business.SubscriptionTier,
            business.SubscriptionStatus,
            business.SubscriptionPrice,
            business.SubscriptionExpiresAt,
            // Manual bank configurations
            settings.BankName,
            settings.AccountName,
            settings.AccountNumber,
            settings.OPayFeesPercent
        });
    }

    [HttpPost("pay-manual")]
    public async Task<IActionResult> PayManual([FromBody] PayManualRequest request)
    {
        var businessId = _tenantProvider.TenantId;
        if (!businessId.HasValue)
        {
            return BadRequest(new { Message = "Active business context is required." });
        }

        var business = await _context.Businesses
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(b => b.Id == businessId.Value);

        if (business == null)
        {
            return NotFound(new { Message = "Business not found." });
        }

        if (string.IsNullOrEmpty(request.PlanName) || string.IsNullOrEmpty(request.ReceiptUrl))
        {
            return BadRequest(new { Message = "PlanName and ReceiptUrl are required." });
        }

        // Calculate cost based on plan rates
        decimal rate = GetPlanRate(request.PlanName);
        decimal baseAmount = rate * request.DurationMonths;

        var payment = new SaaSPayment
        {
            BusinessId = business.Id,
            BusinessName = business.Name,
            Amount = baseAmount,
            PlanName = request.PlanName,
            DurationMonths = request.DurationMonths,
            PaymentMethod = "Manual",
            PaymentStatus = "Pending",
            ReceiptUrl = request.ReceiptUrl,
            Reference = request.Reference,
            CreatedAt = DateTime.UtcNow
        };

        _context.SaaSPayments.Add(payment);

        // Audit Trail
        var audit = new AuditLog
        {
            BusinessId = business.Id,
            Action = "SaaSPaymentSubmitted",
            Details = $"Submitted manual bank payment of ₦{baseAmount:N2} for {request.PlanName} ({request.DurationMonths} months). Status: Pending Approval.",
            UserEmail = User.Identity?.Name ?? "system@vendorainventory.com",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            CreatedAt = DateTime.UtcNow
        };
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return Ok(new { Message = "Receipt submitted successfully. Awaiting Super Admin approval.", PaymentId = payment.Id });
    }

    [HttpPost("pay-opay")]
    public async Task<IActionResult> PayOPay([FromBody] PayOPayRequest request)
    {
        return BadRequest(new { Message = "OPay checkout is currently disabled. Please use manual bank transfer payment." });
    }

    [HttpPost("upload-receipt")]
    public async Task<IActionResult> UploadReceipt(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { Message = "No file uploaded." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new { Message = "Only JPEG and PNG file types are allowed." });
        }

        if (file.Length > 2 * 1024 * 1024)
        {
            return BadRequest(new { Message = "File size must not exceed 2MB." });
        }

        var webRoot = _env.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
        {
            webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        var uploadDir = Path.Combine(webRoot, "uploads", "receipts");
        if (!Directory.Exists(uploadDir))
        {
            Directory.CreateDirectory(uploadDir);
        }

        var uniqueName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadDir, uniqueName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
        var receiptUrl = $"{baseUrl}/uploads/receipts/{uniqueName}";

        return Ok(new { ReceiptUrl = receiptUrl });
    }

    private static decimal GetPlanRate(string tier)
    {
        return tier.ToLowerInvariant() switch
        {
            "starter" => 15000m,
            "pro" => 50000m,
            "enterprise" => 150000m,
            _ => 50000m
        };
    }
}

public class PayManualRequest
{
    public string PlanName { get; set; } = string.Empty;
    public int DurationMonths { get; set; }
    public string ReceiptUrl { get; set; } = string.Empty;
    public string? Reference { get; set; }
}

public class PayOPayRequest
{
    public string PlanName { get; set; } = string.Empty;
    public int DurationMonths { get; set; }
}
