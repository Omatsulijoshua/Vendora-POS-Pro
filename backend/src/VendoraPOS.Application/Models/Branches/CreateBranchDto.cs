using System.ComponentModel.DataAnnotations;

namespace VendoraPOS.Application.Models.Branches;

public class CreateBranchDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string Address { get; set; } = string.Empty;

    [StringLength(50)]
    [Phone]
    public string Phone { get; set; } = string.Empty;
}
