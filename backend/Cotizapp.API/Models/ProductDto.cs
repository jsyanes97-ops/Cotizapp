namespace Cotizapp.API.Models
{
    public class ProductDto
    {
        public Guid? Id { get; set; }
        public Guid ProveedorId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public decimal Precio { get; set; }
        public string Condicion { get; set; } = "nuevo"; 
        public int Stock { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string? ImagenesJson { get; set; }
        
        public decimal? PrecioOriginal { get; set; }
        public bool PermitirNegociacion { get; set; }
        public decimal? PrecioMinimoNegociable { get; set; }
        public string? Etiquetas { get; set; }
        public string? EspecificacionesJson { get; set; }

        public bool Activo { get; set; } = true;
        public DateTime FechaCreacion { get; set; }
    }
}
