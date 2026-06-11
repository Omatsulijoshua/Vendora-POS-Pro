using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VendoraPOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHardeningIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Sales_CreatedAt",
                table: "Sales",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_SentAt",
                table: "Notifications",
                column: "SentAt");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_BusinessId",
                table: "AuditLogs",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_CreatedAt",
                table: "AuditLogs",
                column: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Sales_CreatedAt",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_SentAt",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_BusinessId",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_CreatedAt",
                table: "AuditLogs");
        }
    }
}
