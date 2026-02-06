using System;

namespace Cotizapp.API.Models
{
    public class Payment
    {
        public Guid Id { get; set; }
        public Guid ClienteId { get; set; }
        public Guid ProveedorId { get; set; }
        public decimal Monto { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string ItemType { get; set; } = string.Empty; // Producto o Servicio
        public string Status { get; set; } = "Retenido";
        public DateTime FechaCreacion { get; set; }
        public DateTime FechaActualizacion { get; set; }
        
        // Joined details
        public string? ProviderName { get; set; }
        public string? ClientName { get; set; }
    }

    public class PaymentLog
    {
        public Guid Id { get; set; }
        public Guid PagoId { get; set; }
        public string Accion { get; set; } = string.Empty;
        public string? Mensaje { get; set; }
        public DateTime FechaCreacion { get; set; }
    }

    public class PaymentRequestDto
    {
        public Guid ProveedorId { get; set; }
        public decimal Monto { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string ItemType { get; set; } = string.Empty;
    }

    public class UpdatePaymentStatusDto
    {
        public string NuevoEstado { get; set; } = string.Empty;
        public string Accion { get; set; } = string.Empty;
        public string? Mensaje { get; set; }
    }
}
