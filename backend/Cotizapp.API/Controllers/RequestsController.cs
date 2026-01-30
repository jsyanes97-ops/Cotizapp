using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cotizapp.API.Services;
using Cotizapp.API.Models;

namespace Cotizapp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RequestsController : ControllerBase
    {
        private readonly DbService _db;

        public RequestsController(DbService db)
        {
            _db = db;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateRequest([FromBody] ServiceRequestDto req)
        {
            try 
            {
                var newId = await _db.EditDataReturnObject<Guid>("sp_CrearSolicitudServicio", new {
                    ClienteId = req.ClienteId,
                    Categoria = req.Categoria,
                    Descripcion = req.Descripcion,
                    FotosJson = req.FotosJson,
                    RespuestasGuiadasJson = req.RespuestasGuiadasJson,
                    UbicacionLat = req.UbicacionLat,
                    UbicacionLng = req.UbicacionLng,
                    UbicacionDireccion = req.UbicacionDireccion
                });
                return Ok(new { Id = newId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("nearby")]
        public async Task<IActionResult> GetNearbyRequests([FromQuery] Guid providerId, [FromQuery] double lat, [FromQuery] double lng, [FromQuery] string category)
        {
            var requests = await _db.GetAllAsync<dynamic>("sp_ObtenerSolicitudesCercanas", new {
                ProveedorId = providerId,
                LatProveedor = lat,
                LngProveedor = lng,
                RadioKM = 10, // Default radius
                Categoria = category
            });
            return Ok(requests);
        }

        [HttpPost("quote")]
        public async Task<IActionResult> SubmitQuote([FromBody] QuoteDto req)
        {
            try
            {
                var quoteId = await _db.EditDataReturnObject<Guid>("sp_EnviarCotizacion", new {
                    SolicitudId = req.SolicitudId,
                    ProveedorId = req.ProveedorId,
                    Precio = req.Precio,
                    Mensaje = req.Mensaje,
                    TiempoEstimado = req.TiempoEstimado
                });
                return Ok(new { Id = quoteId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }

    public class ServiceRequestDto
    {
        public Guid ClienteId { get; set; }
        public string Categoria { get; set; }
        public string Descripcion { get; set; }
        public string FotosJson { get; set; } // JSON String
        public string RespuestasGuiadasJson { get; set; } // JSON String
        public double UbicacionLat { get; set; }
        public double UbicacionLng { get; set; }
        public string UbicacionDireccion { get; set; }
    }

    public class QuoteDto
    {
        public Guid SolicitudId { get; set; }
        public Guid ProveedorId { get; set; }
        public decimal Precio { get; set; }
        public string Mensaje { get; set; }
        public string TiempoEstimado { get; set; }
    }
}
