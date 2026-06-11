using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using VendoraPOS.Domain.Entities;
using VendoraPOS.Domain.Enums;

namespace VendoraPOS.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(
        UserManager<User> userManager,
        RoleManager<IdentityRole<Guid>> roleManager)
    {
        // Seed Roles
        var roles = Enum.GetNames<UserRole>();
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid> { Name = roleName });
            }
        }

        // Seed Default SuperAdmin
        var superAdminEmail = "joshuaomatsuli01@gmail.com";
        var superAdminUser = await userManager.FindByEmailAsync(superAdminEmail);

        // Delete old default superadmin if present to clean up database
        var oldSuperAdmin = await userManager.FindByEmailAsync("admin@vendorapos.com");
        if (oldSuperAdmin != null)
        {
            await userManager.DeleteAsync(oldSuperAdmin);
        }

        if (superAdminUser == null)
        {
            var adminUser = new User
            {
                UserName = superAdminEmail,
                Email = superAdminEmail,
                FirstName = "Platform",
                LastName = "Admin",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(adminUser, "Jos@56567");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, UserRole.SuperAdmin.ToString());
            }
        }
    }
}
