using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VendoraPOS.Application.Common.Interfaces;

namespace VendoraPOS.WebApi.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/webhooks")]
public class StripeWebhookController : ControllerBase
{
    private readonly IStripeService _stripeService;

    public StripeWebhookController(IStripeService stripeService)
    {
        _stripeService = stripeService;
    }

    [HttpPost("stripe")]
    public async Task<IActionResult> StripeWebhook()
    {
        try
        {
            using var reader = new StreamReader(HttpContext.Request.Body);
            var json = await reader.ReadToEndAsync();
            var signatureHeader = Request.Headers["Stripe-Signature"].ToString();

            bool result = await _stripeService.HandleWebhookAsync(json, signatureHeader);
            if (result)
            {
                return Ok();
            }
            return BadRequest(new { Message = "Webhook processing failed." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Webhook handler error.", Details = ex.Message });
        }
    }
}
