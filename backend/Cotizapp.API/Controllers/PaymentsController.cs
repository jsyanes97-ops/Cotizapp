using Microsoft.AspNetCore.Mvc;
using Cotizapp.API.Services;
using System;
using System.Threading.Tasks;

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

        public class UpgradeRequest
        {
            public Guid ProviderId { get; set; }
            public string PaymentMethod { get; set; } // 'CreditCard', 'Yappy'
            // In a real scenario, token or card details would go here
        }

        [HttpPost("upgrade")]
        public async Task<IActionResult> UpgradeMembership([FromBody] UpgradeRequest req)
        {
            try
            {
                // 1. Simulate Payment Gateway Processing
                // await PaymentGateway.Charge(req.Token, 5.00);
                
                // 2. If successful, record in DB and update profile
                await _db.EditData("sp_RegistrarPagoMembresia", new {
                    UsuarioId = req.ProviderId,
                    Monto = 5.00, // Hardcoded premium price for now
                    MetodoPago = req.PaymentMethod,
                    ReferenciaExterna = "SIM-" + Guid.NewGuid().ToString().Substring(0, 8)
                });

                return Ok(new { Message = "Membresía actualizada a Premium exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
