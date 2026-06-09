using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VendoraPOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReceiptCustomization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReceiptSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: true),
                    LogoUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    HeaderText = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    FooterText = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ShowLogo = table.Column<bool>(type: "boolean", nullable: false),
                    ShowBranchDetails = table.Column<bool>(type: "boolean", nullable: false),
                    ShowCashierInfo = table.Column<bool>(type: "boolean", nullable: false),
                    ShowQRCode = table.Column<bool>(type: "boolean", nullable: false),
                    ReceiptLayout = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Thermal"),
                    CustomBrandingColor = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReceiptSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReceiptSettings_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReceiptSettings_Businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "Businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReceiptSettings_BranchId",
                table: "ReceiptSettings",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_ReceiptSettings_BusinessId_BranchId",
                table: "ReceiptSettings",
                columns: new[] { "BusinessId", "BranchId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReceiptSettings_BusinessId_GlobalOnly",
                table: "ReceiptSettings",
                column: "BusinessId",
                unique: true,
                filter: "\"BranchId\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReceiptSettings");
        }
    }
}
