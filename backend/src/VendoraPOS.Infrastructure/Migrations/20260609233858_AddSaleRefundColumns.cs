using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VendoraPOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSaleRefundColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRefunded",
                table: "Sales",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundedAt",
                table: "Sales",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRefunded",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "RefundedAt",
                table: "Sales");
        }
    }
}
