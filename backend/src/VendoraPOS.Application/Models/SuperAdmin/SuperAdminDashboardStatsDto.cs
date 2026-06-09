using System;
using System.Collections.Generic;

namespace VendoraPOS.Application.Models.SuperAdmin;

public class SuperAdminDashboardStatsDto
{
    public int TotalBusinesses { get; set; }
    public int ActiveBusinesses { get; set; }
    public int SuspendedBusinesses { get; set; }
    public int ActiveSubscriptions { get; set; }
    public decimal TotalSaaSRevenue { get; set; }
    public decimal MonthlySaaSRevenue { get; set; }
    public int TotalBranches { get; set; }
    public int TotalUsers { get; set; }
    public List<SuperAdminDailyTrendDto> BusinessGrowthTrend { get; set; } = new();
}

public class SuperAdminDailyTrendDto
{
    public string Date { get; set; } = null!; // yyyy-MM-dd
    public int BusinessesCreated { get; set; }
}
