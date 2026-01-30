USE CotizappBD;
GO

-- =============================================
-- SP: Obtener Perfil Proveedor Completo
-- =============================================
CREATE OR ALTER PROCEDURE sp_ObtenerPerfilProveedor
    @UsuarioId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        u.Id,
        u.Nombre,
        u.Email,
        u.Telefono,
        p.Categoria,
        p.Descripcion,
        p.RadioCoberturaKM,
        p.UbicacionLat,
        p.UbicacionLng,
        p.UbicacionDistrito,
        p.EsPremium,
        p.SolicitudesRespondidasMes
    FROM tbl_Usuarios u
    LEFT JOIN tbl_ProveedoresPerfil p ON u.Id = p.UsuarioId
    WHERE u.Id = @UsuarioId;
END
GO
