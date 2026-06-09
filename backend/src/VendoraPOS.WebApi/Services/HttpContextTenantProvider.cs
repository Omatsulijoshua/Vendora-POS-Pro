using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using VendoraPOS.Application.Common.Interfaces;

namespace VendoraPOS.WebApi.Services;

public class HttpContextTenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpContextTenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? TenantId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null) return null;

            // Try to find the business_id claim in the user's claims
            var businessIdClaim = user.FindFirst("business_id")?.Value;
            if (Guid.TryParse(businessIdClaim, out var businessId))
            {
                return businessId;
            }

            return null;
        }
    }

    public Guid? BranchId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null) return null;

            // Try to find the branch_id claim in the user's claims
            var branchIdClaim = user.FindFirst("branch_id")?.Value;
            if (Guid.TryParse(branchIdClaim, out var branchId))
            {
                return branchId;
            }

            return null;
        }
    }
}
