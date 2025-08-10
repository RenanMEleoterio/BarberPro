using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarbeariaSaaS.Migrations
{
    /// <inheritdoc />
    public partial class AddMetodoPagamentoToAgendamento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MetodoPagamento",
                table: "Agendamentos",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PrecoServico",
                table: "Agendamentos",
                type: "numeric(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoServico",
                table: "Agendamentos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MetodoPagamento",
                table: "Agendamentos");

            migrationBuilder.DropColumn(
                name: "PrecoServico",
                table: "Agendamentos");

            migrationBuilder.DropColumn(
                name: "TipoServico",
                table: "Agendamentos");
        }
    }
}
