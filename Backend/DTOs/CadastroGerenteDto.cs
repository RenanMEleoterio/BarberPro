namespace BarbeariaSaaS.DTOs
{
    public class CadastroGerenteDto
    {
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
        public int BarbeariaId { get; set; }
    }
}


