using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Application.Models.Categories;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public CategoriesController(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCategory(Guid id)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null) return NotFound();

        return Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt
        });
    }

    [HttpPost]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        // Check if name is unique within the business
        var exists = await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == dto.Name.ToLower());

        if (exists) return BadRequest("Category name already exists.");

        var category = new Category
        {
            Name = dto.Name,
            Description = dto.Description,
            BusinessId = tenantId.Value
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryDto dto)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (category == null) return NotFound();

        // Check uniqueness for name other than this one
        var exists = await _context.Categories
            .AnyAsync(c => c.Id != id && c.Name.ToLower() == dto.Name.ToLower());

        if (exists) return BadRequest("Category name already exists.");

        category.Name = dto.Name;
        category.Description = dto.Description;

        await _context.SaveChangesAsync();

        return Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (category == null) return NotFound();

        // Soft delete
        category.IsActive = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
