using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Application.Models.Transfers;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.WebApi.Controllers;

[Authorize(Roles = "Owner,Manager")]
[ApiController]
[Route("api/[controller]")]
public class StockTransfersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public StockTransfersController(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<IActionResult> GetStockTransfers()
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        var activeBranchId = _tenantProvider.BranchId;

        var query = _context.StockTransfers
            .IgnoreQueryFilters()
            .Include(st => st.Product)
            .Include(st => st.SourceBranch)
            .Include(st => st.TargetBranch)
            .Include(st => st.InitiatedByUser)
            .Include(st => st.ResolvedByUser)
            .Where(st => st.BusinessId == tenantId.Value);

        if (activeBranchId.HasValue)
        {
            query = query.Where(st => st.SourceBranchId == activeBranchId.Value || st.TargetBranchId == activeBranchId.Value);
        }

        var transfers = await query
            .OrderByDescending(st => st.CreatedAt)
            .Select(st => new StockTransferDto
            {
                Id = st.Id,
                ProductId = st.ProductId,
                ProductName = st.Product.Name,
                SourceBranchId = st.SourceBranchId,
                SourceBranchName = st.SourceBranch.Name,
                TargetBranchId = st.TargetBranchId,
                TargetBranchName = st.TargetBranch.Name,
                Quantity = st.Quantity,
                Status = st.Status.ToString(),
                InitiatedByUserId = st.InitiatedByUserId,
                InitiatedByUserName = $"{st.InitiatedByUser.FirstName} {st.InitiatedByUser.LastName}",
                ResolvedByUserId = st.ResolvedByUserId,
                ResolvedByUserName = st.ResolvedByUser != null ? $"{st.ResolvedByUser.FirstName} {st.ResolvedByUser.LastName}" : null,
                Notes = st.Notes,
                RejectionReason = st.RejectionReason,
                CreatedAt = st.CreatedAt,
                UpdatedAt = st.UpdatedAt
            })
            .ToListAsync();

        return Ok(transfers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetStockTransfer(Guid id)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        var activeBranchId = _tenantProvider.BranchId;

        var st = await _context.StockTransfers
            .IgnoreQueryFilters()
            .Include(t => t.Product)
            .Include(t => t.SourceBranch)
            .Include(t => t.TargetBranch)
            .Include(t => t.InitiatedByUser)
            .Include(t => t.ResolvedByUser)
            .FirstOrDefaultAsync(t => t.Id == id && t.BusinessId == tenantId.Value);

        if (st == null) return NotFound();

        // Branch authorization check
        if (activeBranchId.HasValue && st.SourceBranchId != activeBranchId.Value && st.TargetBranchId != activeBranchId.Value)
        {
            return StatusCode(403, new { Message = "Access denied to this stock transfer." });
        }

        var dto = new StockTransferDto
        {
            Id = st.Id,
            ProductId = st.ProductId,
            ProductName = st.Product.Name,
            SourceBranchId = st.SourceBranchId,
            SourceBranchName = st.SourceBranch.Name,
            TargetBranchId = st.TargetBranchId,
            TargetBranchName = st.TargetBranch.Name,
            Quantity = st.Quantity,
            Status = st.Status.ToString(),
            InitiatedByUserId = st.InitiatedByUserId,
            InitiatedByUserName = $"{st.InitiatedByUser.FirstName} {st.InitiatedByUser.LastName}",
            ResolvedByUserId = st.ResolvedByUserId,
            ResolvedByUserName = st.ResolvedByUser != null ? $"{st.ResolvedByUser.FirstName} {st.ResolvedByUser.LastName}" : null,
            Notes = st.Notes,
            RejectionReason = st.RejectionReason,
            CreatedAt = st.CreatedAt,
            UpdatedAt = st.UpdatedAt
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> InitiateTransfer([FromBody] InitiateTransferDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        // Check SharedStockMode
        var business = await _context.Businesses
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(b => b.Id == tenantId.Value);

        if (business == null) return BadRequest("Business context not found.");
        if (business.SharedStockMode)
        {
            return BadRequest("Stock transfers are disabled in Shared Stock Mode.");
        }

        // Verify Roles & Permissions
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userRole == "Cashier")
        {
            return StatusCode(403, new { Message = "Cashiers are not allowed to initiate stock transfers." });
        }

        if (userRole == "Manager")
        {
            var managerBranchIdClaim = User.FindFirst("branch_id")?.Value;
            if (string.IsNullOrEmpty(managerBranchIdClaim) || !Guid.TryParse(managerBranchIdClaim, out var managerBranchId))
            {
                return BadRequest("Manager does not have an assigned branch context.");
            }

            if (dto.SourceBranchId != managerBranchId)
            {
                return StatusCode(403, new { Message = "Managers can only initiate stock transfers from their assigned branch." });
            }
        }

        // Validate Branches belong to Business
        var sourceBranch = await _context.Branches.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == dto.SourceBranchId && b.BusinessId == tenantId.Value);
        var targetBranch = await _context.Branches.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == dto.TargetBranchId && b.BusinessId == tenantId.Value);

        if (sourceBranch == null) return BadRequest("Source branch not found under this business.");
        if (targetBranch == null) return BadRequest("Target branch not found under this business.");
        if (dto.SourceBranchId == dto.TargetBranchId) return BadRequest("Source and target branches must be different.");

        // Check Product Stock in Source Branch
        var sourceStock = await _context.ProductStocks
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(ps => ps.ProductId == dto.ProductId && ps.BranchId == dto.SourceBranchId);

        if (sourceStock == null || sourceStock.Quantity < dto.Quantity)
        {
            return BadRequest("Insufficient stock at the source branch.");
        }

        // Reserve stock (deduct from source branch)
        int sourceOldQty = sourceStock.Quantity;
        sourceStock.Quantity -= dto.Quantity;

        // Create StockTransfer
        var transfer = new StockTransfer
        {
            BusinessId = tenantId.Value,
            ProductId = dto.ProductId,
            SourceBranchId = dto.SourceBranchId,
            TargetBranchId = dto.TargetBranchId,
            Quantity = dto.Quantity,
            Status = TransferStatus.Pending,
            InitiatedByUserId = currentUserId,
            Notes = dto.Notes
        };

        _context.StockTransfers.Add(transfer);

        // Add Stock Adjustment Log (Outbound reservation)
        var log = new StockAdjustmentLog
        {
            ProductId = dto.ProductId,
            BranchId = dto.SourceBranchId,
            PreviousQuantity = sourceOldQty,
            NewQuantity = sourceStock.Quantity,
            AdjustedByUserId = currentUserId,
            Reason = $"Outbound stock transfer to {targetBranch.Name} initiated (Pending)"
        };

        _context.StockAdjustmentLogs.Add(log);

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetStockTransfer), new { id = transfer.Id }, new StockTransferDto
        {
            Id = transfer.Id,
            ProductId = transfer.ProductId,
            ProductName = (await _context.Products.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == transfer.ProductId))?.Name ?? "Product",
            SourceBranchId = transfer.SourceBranchId,
            SourceBranchName = sourceBranch.Name,
            TargetBranchId = transfer.TargetBranchId,
            TargetBranchName = targetBranch.Name,
            Quantity = transfer.Quantity,
            Status = transfer.Status.ToString(),
            InitiatedByUserId = transfer.InitiatedByUserId,
            Notes = transfer.Notes,
            CreatedAt = transfer.CreatedAt
        });
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> ApproveTransfer(Guid id, [FromBody] ResolveTransferDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        var transfer = await _context.StockTransfers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == id && t.BusinessId == tenantId.Value);

        if (transfer == null) return NotFound();
        if (transfer.Status != TransferStatus.Pending)
        {
            return BadRequest("Only pending transfers can be approved.");
        }

        // Verify Roles & Permissions
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userRole == "Cashier")
        {
            return StatusCode(403, new { Message = "Cashiers are not allowed to resolve stock transfers." });
        }

        if (userRole == "Manager")
        {
            var managerBranchIdClaim = User.FindFirst("branch_id")?.Value;
            if (string.IsNullOrEmpty(managerBranchIdClaim) || !Guid.TryParse(managerBranchIdClaim, out var managerBranchId))
            {
                return BadRequest("Manager does not have an assigned branch context.");
            }

            if (transfer.TargetBranchId != managerBranchId)
            {
                return StatusCode(403, new { Message = "Managers can only approve incoming transfers to their assigned branch." });
            }
        }

        var sourceBranch = await _context.Branches.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == transfer.SourceBranchId);
        var targetBranch = await _context.Branches.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == transfer.TargetBranchId);

        // Fetch or create target branch stock record
        var targetStock = await _context.ProductStocks
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(ps => ps.ProductId == transfer.ProductId && ps.BranchId == transfer.TargetBranchId);

        if (targetStock == null)
        {
            targetStock = new ProductStock
            {
                ProductId = transfer.ProductId,
                BranchId = transfer.TargetBranchId,
                Quantity = 0,
                MinStockLevel = 0
            };
            _context.ProductStocks.Add(targetStock);
        }

        int targetOldQty = targetStock.Quantity;
        targetStock.Quantity += transfer.Quantity;

        // Update transfer status
        transfer.Status = TransferStatus.Approved;
        transfer.ResolvedByUserId = currentUserId;
        transfer.UpdatedAt = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(dto.Notes))
        {
            transfer.Notes = dto.Notes;
        }

        // Add Stock Adjustment Log (Inbound complete)
        var log = new StockAdjustmentLog
        {
            ProductId = transfer.ProductId,
            BranchId = transfer.TargetBranchId,
            PreviousQuantity = targetOldQty,
            NewQuantity = targetStock.Quantity,
            AdjustedByUserId = currentUserId,
            Reason = $"Inbound stock transfer from {sourceBranch?.Name ?? "Unknown"} approved"
        };

        _context.StockAdjustmentLogs.Add(log);

        await _context.SaveChangesAsync();

        return Ok(new { Message = "Stock transfer approved successfully." });
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> RejectTransfer(Guid id, [FromBody] ResolveTransferDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        var transfer = await _context.StockTransfers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == id && t.BusinessId == tenantId.Value);

        if (transfer == null) return NotFound();
        if (transfer.Status != TransferStatus.Pending)
        {
            return BadRequest("Only pending transfers can be rejected.");
        }

        // Verify Roles & Permissions
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userRole == "Cashier")
        {
            return StatusCode(403, new { Message = "Cashiers are not allowed to resolve stock transfers." });
        }

        if (userRole == "Manager")
        {
            var managerBranchIdClaim = User.FindFirst("branch_id")?.Value;
            if (string.IsNullOrEmpty(managerBranchIdClaim) || !Guid.TryParse(managerBranchIdClaim, out var managerBranchId))
            {
                return BadRequest("Manager does not have an assigned branch context.");
            }

            if (transfer.TargetBranchId != managerBranchId)
            {
                return StatusCode(403, new { Message = "Managers can only reject incoming transfers to their assigned branch." });
            }
        }

        var targetBranch = await _context.Branches.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == transfer.TargetBranchId);

        // Return stock to source branch
        var sourceStock = await _context.ProductStocks
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(ps => ps.ProductId == transfer.ProductId && ps.BranchId == transfer.SourceBranchId);

        if (sourceStock == null)
        {
            sourceStock = new ProductStock
            {
                ProductId = transfer.ProductId,
                BranchId = transfer.SourceBranchId,
                Quantity = 0,
                MinStockLevel = 0
            };
            _context.ProductStocks.Add(sourceStock);
        }

        int sourceOldQty = sourceStock.Quantity;
        sourceStock.Quantity += transfer.Quantity;

        // Update transfer status
        transfer.Status = TransferStatus.Rejected;
        transfer.ResolvedByUserId = currentUserId;
        transfer.UpdatedAt = DateTime.UtcNow;
        transfer.RejectionReason = dto.RejectionReason ?? "No reason provided.";

        // Add Stock Adjustment Log (Rejection return)
        var log = new StockAdjustmentLog
        {
            ProductId = transfer.ProductId,
            BranchId = transfer.SourceBranchId,
            PreviousQuantity = sourceOldQty,
            NewQuantity = sourceStock.Quantity,
            AdjustedByUserId = currentUserId,
            Reason = $"Stock transfer rejected by {targetBranch?.Name ?? "Target Branch"} (Returned to source)"
        };

        _context.StockAdjustmentLogs.Add(log);

        await _context.SaveChangesAsync();

        return Ok(new { Message = "Stock transfer rejected successfully. Inventory returned to source." });
    }

    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelTransfer(Guid id, [FromBody] ResolveTransferDto dto)
    {
        var tenantId = _tenantProvider.TenantId;
        if (!tenantId.HasValue) return BadRequest("Tenant context not found.");

        var transfer = await _context.StockTransfers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == id && t.BusinessId == tenantId.Value);

        if (transfer == null) return NotFound();
        if (transfer.Status != TransferStatus.Pending)
        {
            return BadRequest("Only pending transfers can be cancelled.");
        }

        // Verify Roles & Permissions
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userRole == "Cashier")
        {
            return StatusCode(403, new { Message = "Cashiers are not allowed to cancel stock transfers." });
        }

        if (userRole == "Manager")
        {
            var managerBranchIdClaim = User.FindFirst("branch_id")?.Value;
            if (string.IsNullOrEmpty(managerBranchIdClaim) || !Guid.TryParse(managerBranchIdClaim, out var managerBranchId))
            {
                return BadRequest("Manager does not have an assigned branch context.");
            }

            if (transfer.SourceBranchId != managerBranchId)
            {
                return StatusCode(403, new { Message = "Managers can only cancel transfers initiated by their assigned branch." });
            }
        }

        // Return stock to source branch
        var sourceStock = await _context.ProductStocks
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(ps => ps.ProductId == transfer.ProductId && ps.BranchId == transfer.SourceBranchId);

        if (sourceStock == null)
        {
            sourceStock = new ProductStock
            {
                ProductId = transfer.ProductId,
                BranchId = transfer.SourceBranchId,
                Quantity = 0,
                MinStockLevel = 0
            };
            _context.ProductStocks.Add(sourceStock);
        }

        int sourceOldQty = sourceStock.Quantity;
        sourceStock.Quantity += transfer.Quantity;

        // Update transfer status
        transfer.Status = TransferStatus.Cancelled;
        transfer.ResolvedByUserId = currentUserId;
        transfer.UpdatedAt = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(dto.Notes))
        {
            transfer.Notes = dto.Notes;
        }

        // Add Stock Adjustment Log (Cancellation return)
        var log = new StockAdjustmentLog
        {
            ProductId = transfer.ProductId,
            BranchId = transfer.SourceBranchId,
            PreviousQuantity = sourceOldQty,
            NewQuantity = sourceStock.Quantity,
            AdjustedByUserId = currentUserId,
            Reason = "Stock transfer cancelled by initiator (Returned to source)"
        };

        _context.StockAdjustmentLogs.Add(log);

        await _context.SaveChangesAsync();

        return Ok(new { Message = "Stock transfer cancelled successfully. Inventory returned to source." });
    }
}
