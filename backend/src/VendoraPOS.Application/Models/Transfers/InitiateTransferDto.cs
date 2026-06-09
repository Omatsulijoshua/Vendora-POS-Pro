using System;
using System.ComponentModel.DataAnnotations;

namespace VendoraPOS.Application.Models.Transfers;

public class InitiateTransferDto
{
    [Required]
    public Guid ProductId { get; set; }

    [Required]
    public Guid SourceBranchId { get; set; }

    [Required]
    public Guid TargetBranchId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Transfer quantity must be at least 1.")]
    public int Quantity { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}
