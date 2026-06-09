using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
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
    private readonly IStripeService _stripeService;

    public BillingController(
        ApplicationDbContext context,
        ITenantProvider tenantProvider,
        IStripeService stripeService)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _stripeService = stripeService;
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

        return Ok(new
        {
            business.Id,
            business.Name,
            business.SubscriptionTier,
            business.SubscriptionStatus,
            business.SubscriptionPrice,
            business.SubscriptionExpiresAt,
            business.StripeCustomerId,
            business.StripeSubscriptionId,
            IsMockMode = _stripeService.IsMockMode
        });
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> CreateCheckout([FromBody] CreateCheckoutRequest request)
    {
        var businessId = _tenantProvider.TenantId;
        if (!businessId.HasValue)
        {
            return BadRequest(new { Message = "Active business context is required." });
        }

        if (string.IsNullOrEmpty(request.Tier) || string.IsNullOrEmpty(request.BillingCycle))
        {
            return BadRequest(new { Message = "Tier and BillingCycle are required." });
        }

        try
        {
            string url = await _stripeService.CreateCheckoutSessionAsync(
                businessId.Value,
                request.Tier,
                request.BillingCycle,
                request.SuccessUrl,
                request.CancelUrl
            );

            return Ok(new { CheckoutUrl = url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Failed to create checkout session.", Details = ex.Message });
        }
    }

    [HttpPost("portal")]
    public async Task<IActionResult> CreatePortal([FromBody] CreatePortalRequest request)
    {
        var businessId = _tenantProvider.TenantId;
        if (!businessId.HasValue)
        {
            return BadRequest(new { Message = "Active business context is required." });
        }

        try
        {
            string url = await _stripeService.CreateBillingPortalSessionAsync(
                businessId.Value,
                request.ReturnUrl
            );

            return Ok(new { PortalUrl = url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Failed to create billing portal session.", Details = ex.Message });
        }
    }
}

public class CreateCheckoutRequest
{
    public string Tier { get; set; } = "Pro";
    public string BillingCycle { get; set; } = "Yearly";
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}

public class CreatePortalRequest
{
    public string ReturnUrl { get; set; } = string.Empty;
}
