using Microsoft.AspNetCore.Mvc;
using Cotizapp.API.Services;
using Cotizapp.API.Models;

namespace Cotizapp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly DbService _db;

        public PaymentsController(DbService db)
        {
            _db = db;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePayment([FromBody] PaymentRequestDto req, [FromQuery] Guid clientId)
        {
            try
            {
                var payment = await _db.GetAsync<Payment>("sp_RegistrarPago", new {
                    ClienteId = clientId,
                    ProveedorId = req.ProveedorId,
                    Monto = req.Monto,
                    ItemName = req.ItemName,
                    ItemType = req.ItemType
                });
                return Ok(payment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("client/{clientId}")]
        public async Task<IActionResult> GetByClient(Guid clientId)
        {
            try
            {
                var payments = await _db.GetAllAsync<Payment>("sp_ObtenerHistorialPagosCliente", new { ClienteId = clientId });
                
                // For each payment, load its logs
                var paymentList = payments.ToList();
                foreach (var p in paymentList)
                {
                    var logs = await _db.GetAllAsync<PaymentLog>("sp_ObtenerLogsPago", new { PagoId = p.Id });
                    // We'll need a way to return these. For simplicity in this DTO we might add them or return them separately.
                    // Let's assume the frontend will fetch them if needed or we extend the model.
                }

                return Ok(paymentList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("provider/{providerId}")]
        public async Task<IActionResult> GetByProvider(Guid providerId)
        {
            try
            {
                var payments = await _db.GetAllAsync<Payment>("sp_ObtenerHistorialVentasProveedor", new { ProveedorId = providerId });
                return Ok(payments);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdatePaymentStatusDto req)
        {
            try
            {
                var payment = await _db.GetAsync<Payment>("sp_ActualizarEstadoPago", new {
                    PagoId = id,
                    NuevoEstado = req.NuevoEstado,
                    Accion = req.Accion,
                    Mensaje = req.Mensaje
                });
                return Ok(payment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("{id}/logs")]
        public async Task<IActionResult> GetLogs(Guid id)
        {
            try
            {
                var logs = await _db.GetAllAsync<PaymentLog>("sp_ObtenerLogsPago", new { PagoId = id });
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
