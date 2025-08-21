using System.ComponentModel.DataAnnotations;

namespace BarbeariaSaaS.DTOs
{
    public class GoogleAuthDto
    {
        [Required]
        public string IdToken { get; set; }
        
        [Required]
        public string TipoUsuario { get; set; } // Cliente, Barbeiro, Gerente
        
        // Para barbeiros, é necessário o código de convite
        public string? CodigoConvite { get; set; }
        
        // Para barbeiros, campos opcionais
        public string? Especialidades { get; set; }
        public string? Descricao { get; set; }
        
        // Para barbearias (quando tipo é Gerente)
        public string? Endereco { get; set; }
        public string? Telefone { get; set; }

        // Adicionado para lidar com o erro de build
        public string? CodigoBarbearia { get; set; }
        public int? BarbeariaId { get; set; }
    }

    public class GoogleUserInfo
    {
        public string Sub { get; set; } // Google User ID
        public string Email { get; set; }
        public string Name { get; set; }
        public string Picture { get; set; }
        public bool EmailVerified { get; set; }
    }
}



// Forcing recompilation



// Forcing recompilation

