using System;
using System.Collections.Generic;

namespace VendoraPOS.Application.Models.Businesses;

public class OwnerDashboardStatsDto
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalProfit { get; set; }
    public int TotalSalesCount { get; set; }
    public decimal AverageTransactionValue { get; set; }
    public decimal ProfitMargin { get; set; }

    public List<BusinessMetricDto> BusinessMetrics { get; set; } = new();
    public List<BranchMetricDto> BranchMetrics { get; set; } = new();
    public List<OwnerTopProductDto> TopProducts { get; set; } = new();
    public List<OwnerTopCashierDto> TopCashiers { get; set; } = new();
    public List<OwnerDailyTrendDto> DailyTrend { get; set; } = new();
}

public class BusinessMetricDto
{
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = null!;
    public decimal Revenue { get; set; }
    public decimal Profit { get; set; }
    public int SalesCount { get; set; }
    public int BranchesCount { get; set; }
}

public class BranchMetricDto
{
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = null!;
    public decimal Revenue { get; set; }
    public decimal Profit { get; set; }
    public int SalesCount { get; set; }
    public int StaffCount { get; set; }
}

public class OwnerTopProductDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string SKU { get; set; } = null!;
    public int QuantitySold { get; set; }
    public decimal Revenue { get; set; }
    public decimal Profit { get; set; }
}

public class OwnerTopCashierDto
{
    public Guid UserId { get; set; }
    public string CashierName { get; set; } = null!;
    public string BranchName { get; set; } = null!;
    public int SalesCount { get; set; }
    public decimal Revenue { get; set; }
}

public class OwnerDailyTrendDto
{
    public string Date { get; set; } = null!; // yyyy-MM-dd
    public decimal Revenue { get; set; }
    public decimal Profit { get; set; }
    public int SalesCount { get; set; }
}
