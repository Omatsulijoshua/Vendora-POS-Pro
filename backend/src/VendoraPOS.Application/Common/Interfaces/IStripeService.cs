using System;
using System.Threading.Tasks;

namespace VendoraPOS.Application.Common.Interfaces;

public interface IStripeService
{
    bool IsMockMode { get; }
    Task<string> CreateCheckoutSessionAsync(Guid businessId, string tier, string billingCycle, string successUrl, string cancelUrl);
    Task<string> CreateBillingPortalSessionAsync(Guid businessId, string returnUrl);
    Task<bool> HandleWebhookAsync(string jsonPayload, string stripeSignatureHeader);
}
