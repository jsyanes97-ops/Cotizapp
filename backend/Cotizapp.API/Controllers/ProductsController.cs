using Microsoft.AspNetCore.Mvc;
using Cotizapp.API.Services;
using Cotizapp.API.Models;

namespace Cotizapp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly DbService _db;

        public ProductsController(DbService db)
        {
            _db = db;
        }

        [HttpGet("provider/{providerId}")]
        public async Task<IActionResult> GetByProvider(Guid providerId)
        {
            try
            {
                var products = await _db.GetAllAsync<ProductDto>(
                    "sp_ObtenerProductosProveedor", 
                    new { ProveedorId = providerId }
                );
                return Ok(products);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            try
            {
                var products = await _db.GetAllAsync<ProductDto>(
                    "sp_ObtenerProductosActivos", 
                    new { }
                );
                return Ok(products);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("manage")]
        public async Task<IActionResult> ManageProduct([FromBody] ProductDto req)
        {
            try
            {
                string action = req.Id == null ? "INSERT" : "UPDATE";

                var resultId = await _db.EditDataReturnObject<Guid>("sp_GestionarProducto", new {
                    Accion = action,
                    Id = req.Id,
                    ProveedorId = req.ProveedorId,
                    Titulo = req.Titulo,
                    Descripcion = req.Descripcion,
                    Precio = req.Precio,
                    Condicion = req.Condicion,
                    Stock = req.Stock,
                    Categoria = req.Categoria,
                    ImagenesJson = req.ImagenesJson ?? "[]",
                    PrecioOriginal = req.PrecioOriginal,
                    PermitirNegociacion = req.PermitirNegociacion,
                    PrecioMinimoNegociable = req.PrecioMinimoNegociable,
                    Etiquetas = req.Etiquetas,
                    EspecificacionesJson = req.EspecificacionesJson
                });

                return Ok(new { Id = resultId, Message = "Producto guardado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("delete/{id}")]
        public async Task<IActionResult> DeleteProduct(Guid id, [FromQuery] Guid providerId)
        {
            try
            {
                await _db.EditDataReturnObject<Guid>("sp_GestionarProducto", new {
                    Accion = "DELETE",
                    Id = id,
                    ProveedorId = providerId
                });
                return Ok(new { Message = "Producto eliminado" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }



        [HttpPost("negotiate")]
        public async Task<IActionResult> NegotiateProduct([FromBody] NegotiateProductRequest req)
        {
            try
            {
                var rows = await _db.GetAllAsync<NegotiationResult>("sp_IniciarNegociacionProducto", new
                {
                    ProductoId = req.ProductId,
                    ClienteId = req.ClientId,
                    OfertaMonto = req.OfferAmount,
                    Mensaje = req.Message
                });

                var row = rows.FirstOrDefault();
                if (row == null) return BadRequest(new { Error = "No hubo respuesta del servidor" });

                if (row.Status == "ERROR")
                {
                    return BadRequest(new { Error = row.Message });
                }

                return Ok(new { Id = row.Id, Message = "Oferta enviada exitosamente" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in NegotiateProduct: {ex.Message}");
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
    
    public class NegotiateProductRequest
    {
        public Guid ProductId { get; set; }
        public Guid ClientId { get; set; }
        public decimal OfferAmount { get; set; }
        public string Message { get; set; }
    }


}
