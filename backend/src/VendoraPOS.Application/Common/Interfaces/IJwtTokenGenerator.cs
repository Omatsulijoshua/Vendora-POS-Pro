using System.Collections.Generic;
using VendoraPOS.Domain.Entities;

namespace VendoraPOS.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user, IList<string> roles);
}
