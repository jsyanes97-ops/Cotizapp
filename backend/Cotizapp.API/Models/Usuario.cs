namespace Cotizapp.API.Models
{
    public class Usuario
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty; // In real app, only use for mapping DB results carefully
        public string Telefono { get; set; } = string.Empty;
        public string TipoUsuario { get; set; } = "Cliente"; // Cliente, Proveedor
        public DateTime FechaRegistro { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string TipoUsuario { get; set; } = "Cliente";
    }
}
