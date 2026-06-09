using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Models.Branches;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BranchesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BranchesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpGet]
    public async Task<IActionResult> GetBranches()
    {
        var businessIdClaim = User.FindFirst("business_id")?.Value;
        if (string.IsNullOrEmpty(businessIdClaim) || !Guid.TryParse(businessIdClaim, out var businessId))
        {
            return BadRequest(new { Message = "No active business context selected." });
        }

        // Retrieve branches belonging to the active business
        // Note: Global query filter naturally restricts branches if it's configured,
        // but explicit Where(b => b.BusinessId == businessId) ensures safety and clarity.
        var branches = await _context.Branches
            .Where(b => b.BusinessId == businessId)
            .OrderBy(b => b.Name)
            .Select(b => new BranchDto
            {
                Id = b.Id,
                Name = b.Name,
                Address = b.Address,
                Phone = b.Phone,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(branches);
    }

    [Authorize(Roles = "Owner,Manager,Cashier")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetBranch(Guid id)
    {
        var businessIdClaim = User.FindFirst("business_id")?.Value;
        if (string.IsNullOrEmpty(businessIdClaim) || !Guid.TryParse(businessIdClaim, out var businessId))
        {
            return BadRequest(new { Message = "No active business context selected." });
        }

        // Managers and Cashiers can only access their assigned branch
        if (User.IsInRole("Manager") || User.IsInRole("Cashier"))
        {
            var userBranchIdClaim = User.FindFirst("branch_id")?.Value;
            if (string.IsNullOrEmpty(userBranchIdClaim) || !Guid.TryParse(userBranchIdClaim, out var userBranchId) || userBranchId != id)
            {
                return Forbid();
            }
        }

        var branch = await _context.Branches
            .FirstOrDefaultAsync(b => b.Id == id && b.BusinessId == businessId);

        if (branch == null)
        {
            return NotFound(new { Message = "Branch not found." });
        }

        var branchDto = new BranchDto
        {
            Id = branch.Id,
            Name = branch.Name,
            Address = branch.Address,
            Phone = branch.Phone,
            CreatedAt = branch.CreatedAt
        };

        return Ok(branchDto);
    }

    [Authorize(Roles = "Owner")]
    [HttpPost]
    public async Task<IActionResult> CreateBranch([FromBody] CreateBranchDto model)
    {
        var businessIdClaim = User.FindFirst("business_id")?.Value;
        if (string.IsNullOrEmpty(businessIdClaim) || !Guid.TryParse(businessIdClaim, out var businessId))
        {
            return BadRequest(new { Message = "No active business context selected." });
        }

        // Check if branch name is already taken in this business
        var exists = await _context.Branches
            .AnyAsync(b => b.BusinessId == businessId && b.Name.ToLower() == model.Name.ToLower());

        if (exists)
        {
            return BadRequest(new { Message = "A branch with this name already exists in your business." });
        }

        var branch = new Branch
        {
            BusinessId = businessId,
            Name = model.Name,
            Address = model.Address,
            Phone = model.Phone,
            CreatedAt = DateTime.UtcNow
        };

        _context.Branches.Add(branch);
        await _context.SaveChangesAsync();

        var resultDto = new BranchDto
        {
            Id = branch.Id,
            Name = branch.Name,
            Address = branch.Address,
            Phone = branch.Phone,
            CreatedAt = branch.CreatedAt
        };

        return CreatedAtAction(nameof(GetBranch), new { id = branch.Id }, resultDto);
    }
}
