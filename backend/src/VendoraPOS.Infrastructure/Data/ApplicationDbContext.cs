using System;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VendoraPOS.Application.Common.Interfaces;
using VendoraPOS.Domain.Entities;

namespace VendoraPOS.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    private readonly ITenantProvider _tenantProvider;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ITenantProvider tenantProvider) : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductStock> ProductStocks => Set<ProductStock>();
    public DbSet<StockAdjustmentLog> StockAdjustmentLogs => Set<StockAdjustmentLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Rename Identity tables for clean Postgres naming
        builder.Entity<User>(entity => entity.ToTable("Users"));
        builder.Entity<IdentityRole<Guid>>(entity => entity.ToTable("Roles"));
        builder.Entity<IdentityUserRole<Guid>>(entity => entity.ToTable("UserRoles"));
        builder.Entity<IdentityUserClaim<Guid>>(entity => entity.ToTable("UserClaims"));
        builder.Entity<IdentityUserLogin<Guid>>(entity => entity.ToTable("UserLogins"));
        builder.Entity<IdentityRoleClaim<Guid>>(entity => entity.ToTable("RoleClaims"));
        builder.Entity<IdentityUserToken<Guid>>(entity => entity.ToTable("UserTokens"));

        // Configure Business entity
        builder.Entity<Business>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Name).IsRequired().HasMaxLength(200);
            entity.Property(b => b.Subdomain).IsRequired().HasMaxLength(100);
            entity.HasIndex(b => b.Subdomain).IsUnique();

            // Business - Owner relationship (Owner is a User)
            entity.HasOne(b => b.Owner)
                .WithMany()
                .HasForeignKey(b => b.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Branch entity
        builder.Entity<Branch>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Name).IsRequired().HasMaxLength(200);
            entity.Property(b => b.Address).HasMaxLength(500);
            entity.Property(b => b.Phone).HasMaxLength(50);

            // Branch - Business relationship
            entity.HasOne(b => b.Business)
                .WithMany(bus => bus.Branches)
                .HasForeignKey(b => b.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);

            // Tenant & Branch Query Filter
            entity.HasQueryFilter(b => (!_tenantProvider.TenantId.HasValue || b.BusinessId == _tenantProvider.TenantId) && 
                                       (!_tenantProvider.BranchId.HasValue || b.Id == _tenantProvider.BranchId));
        });

        // Configure User relationships
        builder.Entity<User>(entity =>
        {
            entity.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.LastName).IsRequired().HasMaxLength(100);

            // User - Business relationship
            entity.HasOne(u => u.Business)
                .WithMany()
                .HasForeignKey(u => u.BusinessId)
                .OnDelete(DeleteBehavior.SetNull);

            // User - Branch relationship
            entity.HasOne(u => u.Branch)
                .WithMany(b => b.Users)
                .HasForeignKey(u => u.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            // Tenant & Branch Query Filter
            entity.HasQueryFilter(u => (!_tenantProvider.TenantId.HasValue || u.BusinessId == _tenantProvider.TenantId) && 
                                       (!_tenantProvider.BranchId.HasValue || u.BranchId == _tenantProvider.BranchId));
        });

        // Configure Category entity
        builder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(200);
            entity.Property(c => c.Description).HasMaxLength(500);

            // Category - Business relationship
            entity.HasOne(c => c.Business)
                .WithMany()
                .HasForeignKey(c => c.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);

            // Business uniqueness index for category name
            entity.HasIndex(c => new { c.BusinessId, c.Name }).IsUnique();

            // Tenant Query Filter
            entity.HasQueryFilter(c => !_tenantProvider.TenantId.HasValue || c.BusinessId == _tenantProvider.TenantId);
        });

        // Configure Product entity
        builder.Entity<Product>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
            entity.Property(p => p.SKU).IsRequired().HasMaxLength(100);
            entity.Property(p => p.Barcode).HasMaxLength(100);
            entity.Property(p => p.Description).HasMaxLength(1000);
            entity.Property(p => p.Price).HasPrecision(18, 2);
            entity.Property(p => p.CostPrice).HasPrecision(18, 2);

            // Business uniqueness index for SKU
            entity.HasIndex(p => new { p.BusinessId, p.SKU }).IsUnique();

            // Business uniqueness index for Barcode (where not null)
            entity.HasIndex(p => new { p.BusinessId, p.Barcode }).IsUnique();

            // Product - Business relationship
            entity.HasOne(p => p.Business)
                .WithMany()
                .HasForeignKey(p => p.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);

            // Product - Category relationship
            entity.HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            // Tenant Query Filter
            entity.HasQueryFilter(p => !_tenantProvider.TenantId.HasValue || p.BusinessId == _tenantProvider.TenantId);
        });

        // Configure ProductStock entity
        builder.Entity<ProductStock>(entity =>
        {
            entity.HasKey(ps => ps.Id);

            // Product - Stock relationship
            entity.HasOne(ps => ps.Product)
                .WithMany(p => p.ProductStocks)
                .HasForeignKey(ps => ps.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // Branch - Stock relationship (Branch can be null for shared stock)
            entity.HasOne(ps => ps.Branch)
                .WithMany()
                .HasForeignKey(ps => ps.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            // Unique index on ProductId and BranchId (handles nullable BranchId correctly)
            entity.HasIndex(ps => new { ps.ProductId, ps.BranchId }).IsUnique();

            // Tenant & Branch Query Filter:
            // Filters based on current tenant/business, and if a branch context is active,
            // filters to either that branch's stock OR global/shared stock (where BranchId is null).
            entity.HasQueryFilter(ps => 
                (!_tenantProvider.TenantId.HasValue || ps.Product.BusinessId == _tenantProvider.TenantId) &&
                (ps.BranchId == null || !_tenantProvider.BranchId.HasValue || ps.BranchId == _tenantProvider.BranchId)
            );
        });

        // Configure StockAdjustmentLog entity
        builder.Entity<StockAdjustmentLog>(entity =>
        {
            entity.HasKey(sal => sal.Id);
            entity.Property(sal => sal.Reason).IsRequired().HasMaxLength(250);

            // Product - Log relationship
            entity.HasOne(sal => sal.Product)
                .WithMany(p => p.StockAdjustmentLogs)
                .HasForeignKey(sal => sal.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // Branch - Log relationship (can be null for shared stock)
            entity.HasOne(sal => sal.Branch)
                .WithMany()
                .HasForeignKey(sal => sal.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            // User - Log relationship
            entity.HasOne(sal => sal.AdjustedByUser)
                .WithMany()
                .HasForeignKey(sal => sal.AdjustedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Tenant & Branch Query Filter
            entity.HasQueryFilter(sal => 
                (!_tenantProvider.TenantId.HasValue || sal.Product.BusinessId == _tenantProvider.TenantId) &&
                (sal.BranchId == null || !_tenantProvider.BranchId.HasValue || sal.BranchId == _tenantProvider.BranchId)
            );
        });
    }
}
