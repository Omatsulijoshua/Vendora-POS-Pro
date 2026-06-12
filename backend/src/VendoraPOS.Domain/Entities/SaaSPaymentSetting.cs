using System;

namespace VendoraPOS.Domain.Entities;

public class SaaSPaymentSetting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string BankName { get; set; } = "Opay Microfinance bank";
    public string AccountName { get; set; } = "Joshua Toritseju Omatsul";
    public string AccountNumber { get; set; } = "6110540847";
    public decimal OPayFeesPercent { get; set; } = 1.5m; // 1.5%
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
