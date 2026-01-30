USE CotizappBD;
GO

-- =============================================
-- SP: Obtener Todos los Servicios Activos (Marketplace)
-- =============================================
CREATE OR ALTER PROCEDURE sp_ObtenerServiciosActivos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        s.Id,
        s.ProveedorId,
        u.Nombre AS ProveedorNombre,
        pp.Rating AS ProveedorRating,
        s.Categoria,
        s.Titulo,
        s.Descripcion,
        s.Precio,
        s.PrecioTipo, -- 'Fixed', 'Hourly', 'Quote'
        s.Etiquetas, -- JSON or comma-separated
        s.CoberturaArea,
        s.Activo
    FROM tbl_ServiciosOfrecidos s
    INNER JOIN tbl_Usuarios u ON s.ProveedorId = u.Id
    LEFT JOIN tbl_ProveedoresPerfil pp ON u.Id = pp.UsuarioId
    WHERE s.Activo = 1
    ORDER BY pp.EsPremium DESC, NEWID(); -- Premium providers first, then random
END
GO
