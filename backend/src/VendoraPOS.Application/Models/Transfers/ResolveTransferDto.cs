using System.ComponentModel.DataAnnotations;

namespace VendoraPOS.Application.Models.Transfers;

public class ResolveTransferDto
{
    [MaxLength(250)]
    public string? Notes { get; set; }

    [MaxLength(250)]
    public string? RejectionReason { get; set; }
}
