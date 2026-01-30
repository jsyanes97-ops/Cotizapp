using Microsoft.AspNetCore.Mvc;
using Cotizapp.API.Services;
using Cotizapp.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Cotizapp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly DbService _db;
        private readonly IConfiguration _config;

        public AuthController(DbService db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto req)
        {
            Console.WriteLine($"[Register] Received request: {req.Email}, {req.Nombre}, {req.TipoUsuario}");
            
            // PROD: Hash password here using BCrypt or similar
            // For Demo: Storing raw/simple hash (NOT RECOMMENDED for pure prod without library)
            var passHash = req.Password; 

            try 
            {
                Console.WriteLine("[Register] Calling Database sp_GestionarUsuario...");
                var newId = await _db.EditDataReturnObject<Guid>("sp_GestionarUsuario", new {
                    Accion = "INSERT",
                    Nombre = req.Nombre,
                    Email = req.Email,
                    PasswordHash = passHash,
                    Telefono = req.Telefono,
                    TipoUsuario = req.TipoUsuario
                });
                Console.WriteLine($"[Register] Success! New ID: {newId}");

                return Ok(new { Id = newId, Message = "Usuario registrado existosamente" });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[Register] ERROR: {ex.Message}");
                Console.Error.WriteLine(ex.StackTrace);
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto req)
        {
            var user = await _db.GetAsync<Usuario>("sp_LoginUsuario", new { Email = req.Email });

            if (user == null || user.PasswordHash != req.Password) // PROD: Verify hash properly
            {
                return Unauthorized("Credenciales inválidas");
            }

            var token = GenerateJwtToken(user);
            return Ok(new { Token = token, User = new { user.Id, user.Nombre, user.TipoUsuario } });
        }

        private string GenerateJwtToken(Usuario user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("role", user.TipoUsuario)
            };

            var token = new JwtSecurityToken(
                _config["Jwt:Issuer"],
                _config["Jwt:Audience"],
                claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
