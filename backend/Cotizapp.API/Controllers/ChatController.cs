using Microsoft.AspNetCore.Mvc;
using Cotizapp.API.Services;
using Cotizapp.API.Models;

namespace Cotizapp.API.Controllers
{
    [Route("api/chat")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly DbService _db;

        public ChatController(DbService db)
        {
            _db = db;
        }

        [HttpGet("{conversationId}/messages")]
        public async Task<IActionResult> GetMessages(Guid conversationId)
        {
            var messages = await _db.GetAllAsync<dynamic>("sp_ObtenerMensajes", new { ConversacionId = conversationId });
            return Ok(messages);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetConversations(Guid userId)
        {
            try
            {
                var conversations = await _db.GetAllAsync<dynamic>("sp_ObtenerConversacionesUsuario", new { UsuarioId = userId });
                return Ok(conversations);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] MessageDto msg)
        {
             await _db.EditData("sp_EnviarMensaje", new {
                ConversacionId = msg.ConversacionId,
                EmisorId = msg.EmisorId,
                Contenido = msg.Contenido,
                Tipo = msg.Tipo
             });
             return Ok(new { Status = "Sent" });
        }

        [HttpGet("{conversationId}/context")]
        public async Task<IActionResult> GetContext(Guid conversationId)
        {
            try
            {
                var context = await _db.GetAllAsync<NegotiationContextDto>("sp_ObtenerContextoDeChat", new { ConversacionId = conversationId });
                return Ok(context.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpDelete("delete/{conversationId}/{userId}")]
        public async Task<IActionResult> DeleteConversation(Guid conversationId, Guid userId)
        {
            Console.WriteLine($"[DEBUG] Deleting conversation {conversationId} for user {userId}");
            try
            {
                await _db.EditData("sp_EliminarConversacion", new { ConversacionId = conversationId, UsuarioId = userId });
                return Ok(new { Status = "Deleted" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("mark-read/{conversationId}/{userId}")]
        public async Task<IActionResult> MarkAsRead(Guid conversationId, Guid userId)
        {
            try
            {
                await _db.EditData("sp_MarcarMensajesComoLeidos", new { ConversacionId = conversationId, UsuarioId = userId });
                return Ok(new { Status = "Marked as read" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }

    public class MessageDto
    {
        public Guid ConversacionId { get; set; }
        public Guid EmisorId { get; set; }
        public string Contenido { get; set; }
        public string Tipo { get; set; } = "Texto";
    }

    public class NegotiationContextDto
    {
        public Guid NegociacionId { get; set; }
        public string Tipo { get; set; }
        public string Titulo { get; set; }
        public decimal PrecioOriginal { get; set; }
        public decimal OfertaActual { get; set; }
        public Guid UltimoEmisorId { get; set; }
        public string Estado { get; set; }
        public Guid ProveedorId { get; set; }
        public Guid ClienteId { get; set; }
        public int ContadorContraofertas { get; set; }
    }
}
