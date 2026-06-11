using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Models.Staff;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Domain.Enums;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize(Roles = "Owner,Manager")]
[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;

    public StaffController(ApplicationDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetStaff()
    {
        var businessIdClaim = User.FindFirst("business_id")?.Value;
        if (string.IsNullOrEmpty(businessIdClaim) || !Guid.TryParse(businessIdClaim, out var businessId))
        {
            return BadRequest(new { Message = "No active business context selected." });
        }

        // Check if the current context has an active branch filtered
        var branchIdClaim = User.FindFirst("branch_id")?.Value;
        Guid? activeBranchId = null;
        if (!string.IsNullOrEmpty(branchIdClaim) && Guid.TryParse(branchIdClaim, out var bId))
        {
            activeBranchId = bId;
        }

        var query = _context.Users
            .Include(u => u.Branch)
            .Where(u => u.BusinessId == businessId);

        if (activeBranchId.HasValue)
        {
            query = query.Where(u => u.BranchId == activeBranchId.Value);
        }

        var users = await query.ToListAsync();
        var staffList = new List<StaffDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? string.Empty;

            // Only return Managers and Cashiers
            if (role != UserRole.Manager.ToString() && role != UserRole.Cashier.ToString())
            {
                continue;
            }

            staffList.Add(new StaffDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email ?? string.Empty,
                Role = role,
                BranchId = user.BranchId,
                BranchName = user.Branch?.Name ?? "Unassigned",
                IsActive = user.IsActive
            });
        }

        return Ok(staffList);
    }

    [Authorize(Roles = "Owner")]
    [HttpPost]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDto model)
    {
        var businessIdClaim = User.FindFirst("business_id")?.Value;
        if (string.IsNullOrEmpty(businessIdClaim) || !Guid.TryParse(businessIdClaim, out var businessId))
        {
            return BadRequest(new { Message = "No active business context selected." });
        }

        // Verify branch belongs to the owner's active business
        var branch = await _context.Branches
            .FirstOrDefaultAsync(b => b.Id == model.BranchId && b.BusinessId == businessId);

        if (branch == null)
        {
            return BadRequest(new { Message = "Branch not found or access denied." });
        }

        // Check if email is already in use
        var emailExists = await _userManager.FindByEmailAsync(model.Email);
        if (emailExists != null)
        {
            return BadRequest(new { Message = "Email is already registered." });
        }

        // Create User
        var user = new User
        {
            UserName = model.Email,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName,
            BusinessId = businessId,
            BranchId = model.BranchId,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { Message = $"Failed to create staff member: {errors}" });
        }

        // Assign Role
        var roleResult = await _userManager.AddToRoleAsync(user, model.Role);
        if (!roleResult.Succeeded)
        {
            var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
            return BadRequest(new { Message = $"Failed to assign staff role: {errors}" });
        }

        var resultDto = new StaffDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email ?? string.Empty,
            Role = model.Role,
            BranchId = user.BranchId,
            BranchName = branch.Name,
            IsActive = user.IsActive
        };

        return Ok(resultDto);
    }

    [Authorize(Roles = "Owner")]
    [HttpPut("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        var businessIdClaim = User.FindFirst("business_id")?.Value;
        if (string.IsNullOrEmpty(businessIdClaim) || !Guid.TryParse(businessIdClaim, out var businessId))
        {
            return BadRequest(new { Message = "No active business context selected." });
        }

        // Retrieve user, ignoring tenant branch filters to allow reactivating hidden branches' staff
        var staffUser = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == id && u.BusinessId == businessId);

        if (staffUser == null)
        {
            return NotFound(new { Message = "Staff member not found." });
        }

        var roles = await _userManager.GetRolesAsync(staffUser);
        var role = roles.FirstOrDefault() ?? string.Empty;

        // Prevent deactivating SuperAdmins or Owners
        if (role != UserRole.Manager.ToString() && role != UserRole.Cashier.ToString())
        {
            return BadRequest(new { Message = "Only Manager and Cashier accounts can be activated/deactivated." });
        }

        staffUser.IsActive = !staffUser.IsActive;
        var updateResult = await _userManager.UpdateAsync(staffUser);

        if (!updateResult.Succeeded)
        {
            return BadRequest(new { Message = "Failed to update staff status." });
        }

        return Ok(new { Id = staffUser.Id, IsActive = staffUser.IsActive });
    }
}
