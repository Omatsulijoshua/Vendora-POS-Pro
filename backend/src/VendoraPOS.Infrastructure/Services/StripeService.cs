using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.BillingPortal;
using Stripe.Checkout;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Infrastructure.Data;

namespace VendoraPOS.Infrastructure.Services;

public class StripeService : IStripeService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly IConfiguration _configuration;
    private readonly string _secretKey;
    private readonly string _webhookSecret;

    public bool IsMockMode { get; }

    public StripeService(
        ApplicationDbContext context,
        IAuditLogService auditLogService,
        IConfiguration configuration)
    {
        _context = context;
        _auditLogService = auditLogService;
        _configuration = configuration;

        _secretKey = _configuration["Stripe:SecretKey"] ?? string.Empty;
        _webhookSecret = _configuration["Stripe:WebhookSecret"] ?? string.Empty;

        IsMockMode = string.IsNullOrEmpty(_secretKey) || _secretKey.Equals("Mock", StringComparison.OrdinalIgnoreCase);

        if (!IsMockMode)
        {
            StripeConfiguration.ApiKey = _secretKey;
        }
    }

    public async Task<string> CreateCheckoutSessionAsync(
        Guid businessId,
        string tier,
        string billingCycle,
        string successUrl,
        string cancelUrl)
    {
        if (IsMockMode)
        {
            // Return simulation URL
            return $"{successUrl}?session_id=mock_session_{Guid.NewGuid()}&businessId={businessId}&tier={tier}&billingCycle={billingCycle}";
        }

        // Map price IDs based on Tier & Cycle
        string priceId = GetPriceId(tier, billingCycle);

        var options = new Stripe.Checkout.SessionCreateOptions
        {
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<Stripe.Checkout.SessionLineItemOptions>
            {
                new Stripe.Checkout.SessionLineItemOptions
                {
                    Price = priceId,
                    Quantity = 1,
                },
            },
            Mode = "subscription",
            SuccessUrl = successUrl + "?session_id={CHECKOUT_SESSION_ID}",
            CancelUrl = cancelUrl,
            ClientReferenceId = businessId.ToString(),
            Metadata = new Dictionary<string, string>
            {
                { "businessId", businessId.ToString() },
                { "tier", tier },
                { "billingCycle", billingCycle }
            }
        };

        var service = new Stripe.Checkout.SessionService();
        Stripe.Checkout.Session session = await service.CreateAsync(options);
        return session.Url;
    }

    public async Task<string> CreateBillingPortalSessionAsync(Guid businessId, string returnUrl)
    {
        var business = await _context.Businesses
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(b => b.Id == businessId);

        if (business == null)
        {
            throw new Exception("Business not found.");
        }

        if (IsMockMode)
        {
            return $"/mock-stripe-portal?businessId={businessId}&returnUrl={Uri.EscapeDataString(returnUrl)}";
        }

        if (string.IsNullOrEmpty(business.StripeCustomerId))
        {
            throw new Exception("No billing customer associated with this business yet.");
        }

        var options = new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = business.StripeCustomerId,
            ReturnUrl = returnUrl,
        };

        var service = new Stripe.BillingPortal.SessionService();
        Stripe.BillingPortal.Session session = await service.CreateAsync(options);
        return session.Url;
    }

    public async Task<bool> HandleWebhookAsync(string jsonPayload, string stripeSignatureHeader)
    {
        if (IsMockMode)
        {
            // Process as simulated JSON payload
            try
            {
                using var doc = JsonDocument.Parse(jsonPayload);
                var root = doc.RootElement;
                string eventType = root.GetProperty("type").GetString() ?? string.Empty;
                var data = root.GetProperty("data").GetProperty("object");

                return await ProcessWebhookEventAsync(eventType, data, isMock: true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Mock webhook parse error: {ex.Message}");
                return false;
            }
        }

        // Real Mode: Verify signature
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(jsonPayload, stripeSignatureHeader, _webhookSecret);
            var dataObject = stripeEvent.Data.Object as StripeEntity;

            if (dataObject == null) return false;

            // Convert StripeEntity to a dynamic or JSON-serialized structure for processing
            string json = JsonSerializer.Serialize(dataObject);
            using var doc = JsonDocument.Parse(json);
            
            return await ProcessWebhookEventAsync(stripeEvent.Type, doc.RootElement, isMock: false);
        }
        catch (StripeException ex)
        {
            Console.WriteLine($"Stripe signature verification failed: {ex.Message}");
            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Webhook process error: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> ProcessWebhookEventAsync(string eventType, JsonElement dataObj, bool isMock)
    {
        switch (eventType)
        {
            case "checkout.session.completed":
                {
                    string businessIdStr = string.Empty;
                    if (dataObj.TryGetProperty("client_reference_id", out var clientRef))
                    {
                        businessIdStr = clientRef.GetString() ?? string.Empty;
                    }
                    else if (dataObj.TryGetProperty("metadata", out var metaObj) && metaObj.TryGetProperty("businessId", out var busIdVal))
                    {
                        businessIdStr = busIdVal.GetString() ?? string.Empty;
                    }

                    if (!Guid.TryParse(businessIdStr, out var businessId)) return false;

                    string customerId = dataObj.GetProperty("customer").GetString() ?? string.Empty;
                    string subscriptionId = dataObj.GetProperty("subscription").GetString() ?? string.Empty;

                    string tier = "Pro";
                    string billingCycle = "Yearly";

                    if (dataObj.TryGetProperty("metadata", out var meta))
                    {
                        if (meta.TryGetProperty("tier", out var tierVal)) tier = tierVal.GetString() ?? "Pro";
                        if (meta.TryGetProperty("billingCycle", out var cycleVal)) billingCycle = cycleVal.GetString() ?? "Yearly";
                    }

                    var business = await _context.Businesses
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(b => b.Id == businessId);

                    if (business == null) return false;

                    business.StripeCustomerId = customerId;
                    business.StripeSubscriptionId = subscriptionId;
                    business.SubscriptionTier = tier;
                    business.SubscriptionStatus = "Active";
                    business.SubscriptionPrice = GetPlanPrice(tier, billingCycle);
                    business.SubscriptionExpiresAt = billingCycle.Equals("Yearly", StringComparison.OrdinalIgnoreCase)
                        ? DateTime.UtcNow.AddYears(1)
                        : DateTime.UtcNow.AddMonths(1);

                    await _context.SaveChangesAsync();

                    await _auditLogService.LogAsync(
                        "SubscriptionPurchased",
                        $"Purchased {tier} ({billingCycle}) subscription. Exp: {business.SubscriptionExpiresAt}",
                        "stripe-webhook",
                        businessId,
                        "127.0.0.1"
                    );

                    return true;
                }

            case "invoice.payment_succeeded":
                {
                    string subscriptionId = dataObj.GetProperty("subscription").GetString() ?? string.Empty;
                    if (string.IsNullOrEmpty(subscriptionId)) return false;

                    var business = await _context.Businesses
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(b => b.StripeSubscriptionId == subscriptionId);

                    if (business == null) return false;

                    // If mock/real, extend expiration
                    // Annual price defaults to $990, $2990, $9990. Let's inspect the price to determine cycle.
                    bool isYearly = business.SubscriptionPrice >= 500m; 

                    business.SubscriptionStatus = "Active";
                    business.SubscriptionExpiresAt = isYearly 
                        ? DateTime.UtcNow.AddYears(1) 
                        : DateTime.UtcNow.AddMonths(1);

                    await _context.SaveChangesAsync();

                    await _auditLogService.LogAsync(
                        "SubscriptionRenewed",
                        $"Subscription payment succeeded. Renewal extended to: {business.SubscriptionExpiresAt}",
                        "stripe-webhook",
                        business.Id,
                        "127.0.0.1"
                    );

                    return true;
                }

            case "invoice.payment_failed":
                {
                    string subscriptionId = dataObj.GetProperty("subscription").GetString() ?? string.Empty;
                    if (string.IsNullOrEmpty(subscriptionId)) return false;

                    var business = await _context.Businesses
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(b => b.StripeSubscriptionId == subscriptionId);

                    if (business == null) return false;

                    business.SubscriptionStatus = "Past Due";
                    await _context.SaveChangesAsync();

                    await _auditLogService.LogAsync(
                        "SubscriptionPaymentFailed",
                        $"Subscription renewal payment failed. Status set to Past Due.",
                        "stripe-webhook",
                        business.Id,
                        "127.0.0.1"
                    );

                    return true;
                }

            case "customer.subscription.updated":
                {
                    string subscriptionId = string.Empty;
                    if (dataObj.TryGetProperty("id", out var idProp))
                    {
                        subscriptionId = idProp.GetString() ?? string.Empty;
                    }
                    else if (dataObj.TryGetProperty("subscription", out var subProp))
                    {
                        subscriptionId = subProp.GetString() ?? string.Empty;
                    }

                    if (string.IsNullOrEmpty(subscriptionId)) return false;

                    var business = await _context.Businesses
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(b => b.StripeSubscriptionId == subscriptionId);

                    if (business == null) return false;

                    // Handle status mappings from Stripe
                    if (dataObj.TryGetProperty("status", out var statusVal))
                    {
                        string stripeStatus = statusVal.GetString() ?? "active";
                        business.SubscriptionStatus = MapStripeStatus(stripeStatus);
                    }

                    // Check expiration period
                    if (dataObj.TryGetProperty("current_period_end", out var periodEndVal))
                    {
                        long expTimestamp = 0;
                        if (periodEndVal.ValueKind == JsonValueKind.Number)
                        {
                            expTimestamp = periodEndVal.GetInt64();
                        }
                        else if (periodEndVal.ValueKind == JsonValueKind.String && long.TryParse(periodEndVal.GetString(), out var parsedVal))
                        {
                            expTimestamp = parsedVal;
                        }

                        if (expTimestamp > 0)
                        {
                            business.SubscriptionExpiresAt = DateTimeOffset.FromUnixTimeSeconds(expTimestamp).UtcDateTime;
                        }
                    }

                    await _context.SaveChangesAsync();

                    await _auditLogService.LogAsync(
                        "SubscriptionUpdated",
                        $"Subscription context updated. Status: {business.SubscriptionStatus}, Exp: {business.SubscriptionExpiresAt}",
                        "stripe-webhook",
                        business.Id,
                        "127.0.0.1"
                    );

                    return true;
                }

            case "customer.subscription.deleted":
                {
                    string subscriptionId = string.Empty;
                    if (dataObj.TryGetProperty("id", out var idProp))
                    {
                        subscriptionId = idProp.GetString() ?? string.Empty;
                    }
                    else if (dataObj.TryGetProperty("subscription", out var subProp))
                    {
                        subscriptionId = subProp.GetString() ?? string.Empty;
                    }

                    if (string.IsNullOrEmpty(subscriptionId)) return false;

                    var business = await _context.Businesses
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(b => b.StripeSubscriptionId == subscriptionId);

                    if (business == null) return false;

                    business.SubscriptionStatus = "Cancelled";
                    business.SubscriptionExpiresAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();

                    await _auditLogService.LogAsync(
                        "SubscriptionCancelled",
                        $"Subscription cancelled or ended. Platform access restricted.",
                        "stripe-webhook",
                        business.Id,
                        "127.0.0.1"
                    );

                    return true;
                }

            default:
                // Ignore other event types
                return true;
        }
    }

    private string GetPriceId(string tier, string cycle)
    {
        string key = $"Stripe:Prices:{tier}:{cycle}";
        string priceId = _configuration[key] ?? string.Empty;

        if (string.IsNullOrEmpty(priceId))
        {
            // Default pricing keys
            return $"price_{tier.ToLower()}_{cycle.ToLower()}";
        }
        return priceId;
    }

    private decimal GetPlanPrice(string tier, string cycle)
    {
        bool isYearly = cycle.Equals("Yearly", StringComparison.OrdinalIgnoreCase);
        return tier.ToLower() switch
        {
            "basic" => isYearly ? 990.00m : 99.00m,
            "pro" => isYearly ? 2990.00m : 299.00m,
            "enterprise" => isYearly ? 9990.00m : 999.00m,
            _ => isYearly ? 2990.00m : 299.00m
        };
    }

    private string MapStripeStatus(string stripeStatus)
    {
        return stripeStatus.ToLower() switch
        {
            "active" => "Active",
            "trialing" => "Active",
            "past_due" => "Past Due",
            "unpaid" => "Cancelled",
            "canceled" => "Cancelled",
            "incomplete" => "Past Due",
            "incomplete_expired" => "Cancelled",
            _ => "Active"
        };
    }
}
