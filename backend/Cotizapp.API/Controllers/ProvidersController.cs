using Microsoft.AspNetCore.Mvc;
using Cotizapp.API.Services;
using Cotizapp.API.Models;

namespace Cotizapp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProvidersController : ControllerBase
    {
        private readonly DbService _db;

        public ProvidersController(DbService db)
        {
            _db = db;
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetProfile(Guid id)
        {
            try
            {
                var profile = await _db.GetAsync<ProviderProfileDto>("sp_ObtenerPerfilProveedor", new { UsuarioId = id });
                return Ok(profile);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("update")]
        public async Task<IActionResult> UpdateProfile([FromBody] ProviderProfileDto req)
        {
            Console.WriteLine($"[UpdateProfile] Request received for ID: {req.Id}");
            Console.WriteLine($"[UpdateProfile] Data: Nombre={req.Nombre}, Tlf={req.Telefono}, Cat={req.Categoria}, Desc={req.Descripcion}");
            
            try
            {
                // 1. Update basic user info
                Console.WriteLine("[UpdateProfile] Updating tbl_Usuarios...");
                await _db.EditDataReturnObject<Guid>("sp_GestionarUsuario", new {
                    Accion = "UPDATE",
                    Id = req.Id,
                    Nombre = req.Nombre,
                    Telefono = req.Telefono
                });
                Console.WriteLine("[UpdateProfile] tbl_Usuarios updated.");

                // 2. Update provider specific info
                Console.WriteLine("[UpdateProfile] Updating tbl_ProveedoresPerfil...");
                await _db.EditData("sp_GestionarPerfilProveedor", new {
                    UsuarioId = req.Id,
                    Categoria = req.Categoria,
                    Descripcion = req.Descripcion,
                    RadioCoberturaKM = req.RadioCoberturaKM,
                    UbicacionLat = req.UbicacionLat ?? 0,
                    UbicacionLng = req.UbicacionLng ?? 0,
                    UbicacionDistrito = req.UbicacionDistrito ?? "Panamá"
                });
                Console.WriteLine("[UpdateProfile] tbl_ProveedoresPerfil updated.");

                return Ok(new { Message = "Perfil actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UpdateProfile] ERROR: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
