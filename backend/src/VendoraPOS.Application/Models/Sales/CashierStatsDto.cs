using System;
using System.Collections.Generic;

namespace VendoraPOS.Application.Models.Sales;

public class CashierStatsDto
{
    public decimal TodaySalesAmount { get; set; }
    public int TodaySalesCount { get; set; }
    
    public decimal WeeklySalesAmount { get; set; }
    public int WeeklySalesCount { get; set; }
    
    public decimal MonthlySalesAmount { get; set; }
    public int MonthlySalesCount { get; set; }
    
    public decimal LifetimeSalesAmount { get; set; }
    public int LifetimeSalesCount { get; set; }
    
    public decimal AverageTransactionValue { get; set; }
    
    public Dictionary<string, decimal> PaymentMethodAmounts { get; set; } = new();
    public Dictionary<string, int> PaymentMethodCounts { get; set; } = new();
    
    public List<TopProductDto> TopProducts { get; set; } = new();
    public List<DailySaleTrendDto> DailySalesTrend { get; set; } = new();
}

public class TopProductDto
{
    public string ProductName { get; set; } = null!;
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class DailySaleTrendDto
{
    public string Date { get; set; } = null!; // yyyy-MM-dd
    public decimal Amount { get; set; }
    public int Count { get; set; }
}
