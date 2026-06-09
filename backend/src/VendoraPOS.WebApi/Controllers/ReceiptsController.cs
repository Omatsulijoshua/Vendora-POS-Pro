using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Application.Models.Receipts;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize(Roles = "Owner,Manager")]
[ApiController]
[Route("api/[controller]")]
public class ReceiptsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly IWebHostEnvironment _env;

    public ReceiptsController(
        ApplicationDbContext context, 
        ITenantProvider tenantProvider,
        IWebHostEnvironment env)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetReceiptSetting([FromQuery] Guid? branchId)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // Managers are strictly isolated to their assigned branch settings
        if (userRole == "Manager")
        {
            var branchIdClaim = User.FindFirst("branch_id")?.Value;
            if (string.IsNullOrEmpty(branchIdClaim) || !Guid.TryParse(branchIdClaim, out var managerBranchId))
            {
                return BadRequest(new { Message = "User branch context not found." });
            }
            branchId = managerBranchId;
        }

        // Fetch business name
        var businessName = await _context.Businesses
            .IgnoreQueryFilters()
            .Where(b => b.Id == tenantId.Value)
            .Select(b => b.Name)
            .FirstOrDefaultAsync() ?? "Vendora POS Pro";

        // Try to fetch branch override first, if branchId is specified
        ReceiptSetting setting = null;
        if (branchId.HasValue)
        {
            setting = await _context.ReceiptSettings
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(rs => rs.BusinessId == tenantId.Value && rs.BranchId == branchId.Value);
        }

        // If no branch override, fetch business default settings (BranchId == null)
        if (setting == null)
        {
            setting = await _context.ReceiptSettings
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(rs => rs.BusinessId == tenantId.Value && rs.BranchId == null);
        }

        // If no settings exist at all, create a business default on the fly
        if (setting == null)
        {
            setting = new ReceiptSetting
            {
                BusinessId = tenantId.Value,
                BranchId = null,
                HeaderText = "Welcome to our store!",
                FooterText = "Thank you for your patronage. Please keep this receipt.",
                ShowLogo = true,
                ShowBranchDetails = true,
                ShowCashierInfo = true,
                ShowQRCode = true,
                ReceiptLayout = "Thermal",
                CustomBrandingColor = "#6366F1"
            };
            _context.ReceiptSettings.Add(setting);
            await _context.SaveChangesAsync();
        }

        var dto = MapToDto(setting, businessName);
        return Ok(dto);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateReceiptSetting([FromBody] UpdateReceiptSettingDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest(new { Message = "Tenant context not found." });

        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var targetBranchId = dto.BranchId;

        // Managers are strictly isolated to their assigned branch settings
        if (userRole == "Manager")
        {
            var branchIdClaim = User.FindFirst("branch_id")?.Value;
            if (string.IsNullOrEmpty(branchIdClaim) || !Guid.TryParse(branchIdClaim, out var managerBranchId))
            {
                return BadRequest(new { Message = "User branch context not found." });
            }
            targetBranchId = managerBranchId;
        }

        // Verify branch belongs to the business if Owner attempts to set branch setting override
        if (targetBranchId.HasValue)
        {
            var branchExists = await _context.Branches
                .IgnoreQueryFilters()
                .AnyAsync(b => b.Id == targetBranchId.Value && b.BusinessId == tenantId.Value);

            if (!branchExists) return BadRequest(new { Message = "Branch not found." });
        }

        // Fetch business name
        var businessName = await _context.Businesses
            .IgnoreQueryFilters()
            .Where(b => b.Id == tenantId.Value)
            .Select(b => b.Name)
            .FirstOrDefaultAsync() ?? "Vendora POS Pro";

        // Find or create
        var setting = await _context.ReceiptSettings
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(rs => rs.BusinessId == tenantId.Value && rs.BranchId == targetBranchId);

        if (setting == null)
        {
            setting = new ReceiptSetting
            {
                BusinessId = tenantId.Value,
                BranchId = targetBranchId
            };
            _context.ReceiptSettings.Add(setting);
        }

        setting.LogoUrl = dto.LogoUrl;
        setting.HeaderText = dto.HeaderText;
        setting.FooterText = dto.FooterText;
        setting.ShowLogo = dto.ShowLogo;
        setting.ShowBranchDetails = dto.ShowBranchDetails;
        setting.ShowCashierInfo = dto.ShowCashierInfo;
        setting.ShowQRCode = dto.ShowQRCode;
        setting.ReceiptLayout = dto.ReceiptLayout;
        setting.CustomBrandingColor = dto.CustomBrandingColor;
        setting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(MapToDto(setting, businessName));
    }

    [HttpPost("upload-logo")]
    public async Task<IActionResult> UploadLogo(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { Message = "No file uploaded." });
        }

        // Validate image format
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new { Message = "Only JPEG and PNG file types are allowed." });
        }

        // Validate size (max 2MB)
        if (file.Length > 2 * 1024 * 1024)
        {
            return BadRequest(new { Message = "File size must not exceed 2MB." });
        }

        var webRoot = _env.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
        {
            webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        var uploadDir = Path.Combine(webRoot, "uploads", "logos");
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
        var logoUrl = $"{baseUrl}/uploads/logos/{uniqueName}";

        return Ok(new { LogoUrl = logoUrl });
    }

    private static ReceiptSettingDto MapToDto(ReceiptSetting s, string businessName)
    {
        return new ReceiptSettingDto
        {
            Id = s.Id,
            BusinessId = s.BusinessId,
            BusinessName = businessName,
            BranchId = s.BranchId,
            LogoUrl = s.LogoUrl,
            HeaderText = s.HeaderText,
            FooterText = s.FooterText,
            ShowLogo = s.ShowLogo,
            ShowBranchDetails = s.ShowBranchDetails,
            ShowCashierInfo = s.ShowCashierInfo,
            ShowQRCode = s.ShowQRCode,
            ReceiptLayout = s.ReceiptLayout,
            CustomBrandingColor = s.CustomBrandingColor
        };
    }
}
