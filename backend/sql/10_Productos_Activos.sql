USE CotizappBD;
GO

-- =============================================
-- SP: Obtener Todos los Productos Activos (Marketplace)
-- =============================================
CREATE OR ALTER PROCEDURE sp_ObtenerProductosActivos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        p.Id,
        p.ProveedorId,
        u.Nombre AS ProveedorNombre,
        pp.Rating AS ProveedorRating,
        p.Categoria,
        p.Titulo,
        p.Descripcion,
        p.Precio,
        p.Condicion, -- 'Nuevo', 'Usado', etc.
        p.Stock,
        p.ImagenesJson,
        p.PrecioOriginal,
        p.PermitirNegociacion,
        p.PrecioMinimoNegociable,
        p.Etiquetas,
        p.EspecificacionesJson,
        p.Activo,
        p.FechaCreacion
    FROM tbl_Productos p
    INNER JOIN tbl_Usuarios u ON p.ProveedorId = u.Id
    LEFT JOIN tbl_ProveedoresPerfil pp ON u.Id = pp.UsuarioId
    WHERE p.Activo = 1 AND p.Stock > 0
    ORDER BY pp.EsPremium DESC, NEWID();
END
GO
