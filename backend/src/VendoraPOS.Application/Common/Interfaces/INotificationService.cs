using System;
using System.Threading.Tasks;

namespace VendoraPOS.Application.Common.Interfaces;

public interface INotificationService
{
    Task SendNotificationAsync(Guid? businessId, Guid? branchId, string recipientEmail, string type, string channel, string title, string message);
    Task CheckAndTriggerLowStockAlertAsync(Guid productId, Guid branchId);
    Task CheckAndTriggerSubscriptionRemindersAsync();
}
