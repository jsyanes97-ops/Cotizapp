namespace Cotizapp.API.Models
{
    public class ProviderProfileDto
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; }
        public string Email { get; set; }
        public string Telefono { get; set; }
        public string Categoria { get; set; }
        public string Descripcion { get; set; }
        public int RadioCoberturaKM { get; set; }
        public double? UbicacionLat { get; set; }
        public double? UbicacionLng { get; set; }
        public string UbicacionDistrito { get; set; }
        public bool EsPremium { get; set; }
        public int SolicitudesRespondidasMes { get; set; }
    }
}
