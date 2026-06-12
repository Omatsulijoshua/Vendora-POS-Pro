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

        // Seed Default SuperAdmins
        var superAdminEmails = new[] { "joshuaomatsuli01@gmail.com", "vendora01@gmail.com" };
        var superAdminPasswords = new[] { "Jos@56567", "Admin@123" };

        // Delete old default superadmin if present to clean up database
        var oldSuperAdmin = await userManager.FindByEmailAsync("admin@vendorapos.com");
        if (oldSuperAdmin != null)
        {
            await userManager.DeleteAsync(oldSuperAdmin);
        }

        for (int i = 0; i < superAdminEmails.Length; i++)
        {
            var email = superAdminEmails[i];
            var password = superAdminPasswords[i];
            var superAdminUser = await userManager.FindByEmailAsync(email);

            if (superAdminUser == null)
            {
                var adminUser = new User
                {
                    UserName = email,
                    Email = email,
                    FirstName = "Platform",
                    LastName = "Admin",
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(adminUser, password);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, UserRole.SuperAdmin.ToString());
                }
            }
        }
    }
}
