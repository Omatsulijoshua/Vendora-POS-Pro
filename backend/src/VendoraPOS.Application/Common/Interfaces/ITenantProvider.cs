using System;

namespace VendoraPOS.Application.Common.Interfaces;

public interface ITenantProvider
{
    Guid? TenantId { get; }
    Guid? BranchId { get; }
}
