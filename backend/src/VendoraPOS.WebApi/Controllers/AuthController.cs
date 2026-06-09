using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Application.Models.Auth;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Domain.Enums;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        ApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    [HttpPost("register-owner")]
    public async Task<IActionResult> RegisterOwner([FromBody] RegisterOwnerDto model)
    {
        // Start transaction
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Check if subdomain is taken (we ignore global tenant filter for this query)
            var subdomainExists = await _context.Businesses
                .IgnoreQueryFilters()
                .AnyAsync(b => b.Subdomain.ToLower() == model.Subdomain.ToLower());

            if (subdomainExists)
            {
                return BadRequest(new { Message = "Subdomain is already taken." });
            }

            // Check if email is registered
            var emailExists = await _userManager.FindByEmailAsync(model.Email);
            if (emailExists != null)
            {
                return BadRequest(new { Message = "Email is already registered." });
            }

            // Create User (Owner)
            var user = new User
            {
                UserName = model.Email,
                Email = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName,
                EmailConfirmed = true
            };

            var userResult = await _userManager.CreateAsync(user, model.Password);
            if (!userResult.Succeeded)
            {
                var errors = string.Join(", ", userResult.Errors.Select(e => e.Description));
                return BadRequest(new { Message = $"Failed to create user: {errors}" });
            }

            // Create Business
            var business = new Business
            {
                Name = model.BusinessName,
                Subdomain = model.Subdomain.ToLower(),
                OwnerId = user.Id,
                IsActive = true
            };

            _context.Businesses.Add(business);
            await _context.SaveChangesAsync();

            // Link User to Business
            user.BusinessId = business.Id;
            await _userManager.UpdateAsync(user);

            // Assign Owner Role
            var roleResult = await _userManager.AddToRoleAsync(user, UserRole.Owner.ToString());
            if (!roleResult.Succeeded)
            {
                var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
                return BadRequest(new { Message = $"Failed to assign owner role: {errors}" });
            }

            // Commit transaction
            await transaction.CommitAsync();

            // Generate Token
            var roles = new[] { UserRole.Owner.ToString() };
            var token = _jwtTokenGenerator.GenerateToken(user, roles);

            return Ok(new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                Email = user.Email,
                Role = UserRole.Owner.ToString(),
                BusinessId = business.Id
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { Message = "An error occurred during registration.", Details = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        // Disable global filters to find user during login
        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.NormalizedEmail == model.Email.ToUpper());

        if (user == null)
        {
            return Unauthorized(new { Message = "Invalid email or password." });
        }

        // Verify password
        var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
        if (!result.Succeeded)
        {
            return Unauthorized(new { Message = "Invalid email or password." });
        }

        // Verify account is active
        if (!user.IsActive)
        {
            return BadRequest(new { Message = "Your account has been deactivated. Please contact your administrator." });
        }

        // Check if tenant is suspended (only for non-SuperAdmin users)
        if (user.BusinessId.HasValue)
        {
            var business = await _context.Businesses
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(b => b.Id == user.BusinessId.Value);

            if (business != null && !business.IsActive)
            {
                return StatusCode(403, new { Message = "Your business account has been suspended. Please contact the administrator." });
            }
        }

        // Get Roles
        var roles = await _userManager.GetRolesAsync(user);

        // Generate Token
        var token = _jwtTokenGenerator.GenerateToken(user, roles);

        return Ok(new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            Role = roles.FirstOrDefault() ?? string.Empty,
            BusinessId = user.BusinessId,
            BranchId = user.BranchId
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return NotFound(new { Message = "User not found." });
        }

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new AuthResponseDto
        {
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            Role = roles.FirstOrDefault() ?? string.Empty,
            BusinessId = user.BusinessId,
            BranchId = user.BranchId
        });
    }

    [Authorize(Roles = "Owner")]
    [HttpPost("switch-business/{businessId}")]
    public async Task<IActionResult> SwitchBusiness(Guid businessId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Verify the business exists and belongs to this owner
        var business = await _context.Businesses
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(b => b.Id == businessId && b.OwnerId == userId);

        if (business == null)
        {
            return BadRequest(new { Message = "Business not found or access denied." });
        }

        if (!business.IsActive)
        {
            return BadRequest(new { Message = "This business is suspended." });
        }

        // Update active BusinessId, and reset BranchId
        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return NotFound(new { Message = "User not found." });
        }

        user.BusinessId = businessId;
        user.BranchId = null; // Clear branch context when switching business

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { Message = "Failed to switch business context." });
        }

        // Generate updated Token with new business claims
        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtTokenGenerator.GenerateToken(user, roles);

        return Ok(new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            Role = roles.FirstOrDefault() ?? string.Empty,
            BusinessId = user.BusinessId,
            BranchId = user.BranchId
        });
    }

    [Authorize(Roles = "Owner")]
    [HttpPost("switch-branch/{branchId}")]
    public async Task<IActionResult> SwitchBranch(string branchId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return NotFound(new { Message = "User not found." });
        }

        if (branchId.ToLower() == "global")
        {
            user.BranchId = null;
        }
        else
        {
            if (!Guid.TryParse(branchId, out var parsedBranchId))
            {
                return BadRequest(new { Message = "Invalid Branch ID format." });
            }

            // Verify the branch belongs to the user's active business
            var branchExists = await _context.Branches
                .IgnoreQueryFilters()
                .AnyAsync(b => b.Id == parsedBranchId && b.BusinessId == user.BusinessId);

            if (!branchExists)
            {
                return BadRequest(new { Message = "Branch not found or access denied." });
            }

            user.BranchId = parsedBranchId;
        }

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { Message = "Failed to switch branch context." });
        }

        // Generate updated Token with new branch claims
        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtTokenGenerator.GenerateToken(user, roles);

        return Ok(new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            Role = roles.FirstOrDefault() ?? string.Empty,
            BusinessId = user.BusinessId,
            BranchId = user.BranchId
        });
    }
}
