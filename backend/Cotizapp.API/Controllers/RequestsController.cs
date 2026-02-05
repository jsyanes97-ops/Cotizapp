using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cotizapp.API.Services;
using Cotizapp.API.Models;
using Dapper;
using System.Data;

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
                var p = new DynamicParameters();
                p.Add("ClienteId", req.ClienteId);
                p.Add("ProveedorId", req.ProveedorId); // Can be null now
                p.Add("ServicioId", req.ServicioId);   // Can be null now
                p.Add("Categoria", req.Categoria);
                p.Add("Descripcion", req.Descripcion);
                p.Add("Titulo", req.Titulo);
                p.Add("Prioridad", req.Prioridad);
                p.Add("FotosJson", req.FotosJson);
                p.Add("RespuestasGuiadasJson", req.RespuestasGuiadasJson);
                p.Add("UbicacionLat", req.UbicacionLat);
                p.Add("UbicacionLng", req.UbicacionLng);
                p.Add("UbicacionDireccion", req.UbicacionDireccion);
                p.Add("NewId", dbType: DbType.Guid, direction: ParameterDirection.Output);

                await _db.EditData("sp_CrearSolicitudServicio", p);
                
                var newId = p.Get<Guid>("NewId");
                return Ok(new { Id = newId });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("provider/{providerId}")]
        public async Task<IActionResult> GetProviderRequests(Guid providerId)
        {
            try
            {
                var requests = await _db.GetAllAsync<dynamic>("sp_ObtenerSolicitudesProveedor", new { ProveedorId = providerId });
                return Ok(requests);
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
            Console.WriteLine($"[API] SubmitQuote called. SolicitudId: {req.SolicitudId}, Prov: {req.ProveedorId}, Price: {req.Precio}, Neg: {req.IsNegotiable}");
            try
            {
                // DEBUGGING: Use dynamic to catch "ERROR" rows from SP without crashing Dapper
                var result = await _db.EditDataReturnObject<dynamic>("sp_EnviarCotizacion", new {
                    SolicitudId = req.SolicitudId,
                    ProveedorId = req.ProveedorId,
                    Precio = req.Precio,
                    Mensaje = req.Mensaje,
                    TiempoEstimado = req.TiempoEstimado,
                    EsNegociable = req.IsNegotiable
                });

                // Safely handle result
                var dict = result as IDictionary<string, object>;
                
                if (dict != null)
                {
                     if (dict.ContainsKey("Status") && dict["Status"]?.ToString() == "ERROR")
                     {
                         var msg = dict.ContainsKey("Message") ? dict["Message"]?.ToString() : "Unknown DB Error";
                         Console.WriteLine($"[API LOGIC ERROR] {msg}");
                         return BadRequest(new { Error = msg });
                     }
                     if (dict.ContainsKey("Id"))
                     {
                         return Ok(new { Id = dict["Id"] });
                     }
                }

                Console.WriteLine("[API ERROR] No result dictionary or Id found in DB response.");
                return BadRequest(new { Error = "No se pudo procesar la cotización en la base de datos." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[API ERROR] SubmitQuote Failed: {ex.Message}");
                return BadRequest(new { Error = ex.Message });
            }
        }

    }

    public class ServiceRequestDto
    {
        public Guid ClienteId { get; set; }
        public Guid? ProveedorId { get; set; } // Optional for direct requests
        public Guid? ServicioId { get; set; } // Optional for direct requests
        public string Categoria { get; set; } = string.Empty;
        public string? Titulo { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public string? Prioridad { get; set; }
        public string? FotosJson { get; set; } // JSON String
        public string? RespuestasGuiadasJson { get; set; } // JSON String
        public double UbicacionLat { get; set; }
        public double UbicacionLng { get; set; }
        public string? UbicacionDireccion { get; set; }
    }

    public class QuoteDto
    {
        public Guid SolicitudId { get; set; }
        public Guid ProveedorId { get; set; }
        public decimal Precio { get; set; }
        public string? Mensaje { get; set; }
        public string? TiempoEstimado { get; set; }
        public bool IsNegotiable { get; set; }
    }
}

