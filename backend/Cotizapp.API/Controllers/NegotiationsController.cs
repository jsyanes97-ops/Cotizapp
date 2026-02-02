using Microsoft.AspNetCore.Mvc;
using Cotizapp.API.Services;
using Cotizapp.API.Models;

namespace Cotizapp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NegotiationsController : ControllerBase
    {
        private readonly DbService _db;

        public NegotiationsController(DbService db)
        {
            _db = db;
        }

        [HttpGet("provider/{providerId}")]
        public async Task<IActionResult> GetByProvider(Guid providerId)
        {
            try
            {
                var negotiations = await _db.GetAllAsync<ProviderNegotiationDto>(
                    "sp_ObtenerNegociacionesProveedor",
                    new { ProveedorId = providerId }
                );
                return Ok(negotiations);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("respond")]
        public async Task<IActionResult> Respond([FromBody] NegotiationResponseRequest req)
        {
            try
            {
                string spName = req.Type == "Servicio" 
                    ? "sp_GestionarNegociacionServicio" 
                    : "sp_GestionarNegociacionProducto";

                var rows = await _db.GetAllAsync<NegotiationResult>(spName, new
                {
                    NegociacionId = req.NegotiationId,
                    ProveedorId = req.ProviderId,
                    Accion = req.Action, 
                    MontoContraoferta = req.CounterOfferAmount,
                    Mensaje = req.Message
                });

                var row = rows.FirstOrDefault();
                if (row == null) return BadRequest(new { Error = "No response from server" });

                if (row.Status == "ERROR")
                {
                    return BadRequest(new { Error = row.Message });
                }

                return Ok(new { Message = row.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("respond/client")]
        public async Task<IActionResult> RespondClient([FromBody] ClientNegotiationResponseRequest req)
        {
            try
            {
                string spName = req.Type == "Servicio" 
                    ? "sp_GestionarNegociacionClienteServicio" 
                    : "sp_GestionarNegociacionClienteProducto";

                var rows = await _db.GetAllAsync<NegotiationResult>(spName, new
                {
                    NegociacionId = req.NegotiationId,
                    ClienteId = req.ClientId,
                    Accion = req.Action, 
                    MontoContraoferta = req.CounterOfferAmount,
                    Mensaje = req.Message
                });

                var row = rows.FirstOrDefault();
                if (row == null) return BadRequest(new { Error = "No response from server" });

                if (row.Status == "ERROR")
                {
                    return BadRequest(new { Error = row.Message });
                }

                return Ok(new { Message = row.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }

    public class ProviderNegotiationDto
    {
        public string TipoRelacion { get; set; }
        public Guid Id { get; set; }
        public Guid ItemId { get; set; }
        public string ItemTitulo { get; set; }
        public string ClienteNombre { get; set; }
        public decimal PrecioOriginal { get; set; }
        public decimal OfertaActual { get; set; }
        public Guid UltimoEmisorId { get; set; }
        public string Estado { get; set; }
        public int ContadorContraofertas { get; set; }
        public DateTime FechaActualizacion { get; set; }
    }

    public class NegotiationResponseRequest
    {
        public Guid NegotiationId { get; set; }
        public Guid ProviderId { get; set; }
        public string Type { get; set; } // 'Servicio' or 'Producto'
        public string Action { get; set; } // 'Aceptar', 'Rechazar', 'Contraoferta'
        public decimal? CounterOfferAmount { get; set; }
        public string? Message { get; set; }
    }

    public class ClientNegotiationResponseRequest
    {
        public Guid NegotiationId { get; set; }
        public Guid ClientId { get; set; }
        public string Type { get; set; } 
        public string Action { get; set; } 
        public decimal? CounterOfferAmount { get; set; }
        public string? Message { get; set; }
    }
}
