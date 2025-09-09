using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarbeariaSaaS.Migrations
{
    /// <inheritdoc />
    public partial class AddBarbershopConfigFieldsForConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CloseTime",
                table: "Barbearias",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OpenTime",
                table: "Barbearias",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "WorkDays",
                table: "Barbearias",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CloseTime",
                table: "Barbearias");

            migrationBuilder.DropColumn(
                name: "OpenTime",
                table: "Barbearias");

            migrationBuilder.DropColumn(
                name: "WorkDays",
                table: "Barbearias");
        }
    }
}
