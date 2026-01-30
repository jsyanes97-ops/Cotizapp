namespace Cotizapp.API.Models
{
    public class ServiceListingDto
    {
        public Guid? Id { get; set; }
        public Guid ProveedorId { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public decimal Precio { get; set; }
        public string PrecioTipo { get; set; } = "fixed"; // fixed, starting-from, per-hour
        public string? Etiquetas { get; set; }
        public string? CoberturaArea { get; set; }
        public bool Activo { get; set; } = true;
        public bool PermitirNegociacion { get; set; } = false;
        public decimal? PrecioMinimo { get; set; }
        public DateTime FechaCreacion { get; set; }
    }
}
