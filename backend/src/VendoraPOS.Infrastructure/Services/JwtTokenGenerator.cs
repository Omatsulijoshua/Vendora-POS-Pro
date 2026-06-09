using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Infrastructure.Data;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Domain.Entities;

namespace VendoraPOS.Infrastructure.Services;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;

    public JwtTokenGenerator(IConfiguration configuration, ApplicationDbContext context)
    {
        _configuration = configuration;
        _context = context;
    }

    public string GenerateToken(User user, IList<string> roles)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? "A_Very_Long_And_Super_Secret_Key_For_Vendora_POS_Pro_2026!";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "VendoraPOS.WebApi";
        var audience = _configuration["JwtSettings:Audience"] ?? "VendoraPOS.Frontend";
        var expiryMinutesStr = _configuration["JwtSettings:ExpiryMinutes"];
        var expiryMinutes = double.TryParse(expiryMinutesStr, out var minutes) ? minutes : 1440; // Default 1 day

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("first_name", user.FirstName),
            new Claim("last_name", user.LastName)
        };

        // Add tenant and branch ID if present
        bool isSubscriptionActive = true;
        if (user.BusinessId.HasValue)
        {
            claims.Add(new Claim("business_id", user.BusinessId.Value.ToString()));

            var business = _context.Businesses
                .IgnoreQueryFilters()
                .FirstOrDefault(b => b.Id == user.BusinessId.Value);

            if (business != null)
            {
                var isExpired = business.SubscriptionExpiresAt.HasValue && business.SubscriptionExpiresAt.Value < DateTime.UtcNow;
                var isInactive = business.SubscriptionStatus == "Cancelled" || business.SubscriptionStatus == "Past Due";
                if (isExpired || isInactive)
                {
                    isSubscriptionActive = false;
                }
            }
        }
        claims.Add(new Claim("is_subscription_active", isSubscriptionActive.ToString().ToLower()));
        if (user.BranchId.HasValue)
        {
            claims.Add(new Claim("branch_id", user.BranchId.Value.ToString()));
        }

        // Add roles claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
