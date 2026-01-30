USE CotizappBD;
GO

-- 1. Alter Table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tbl_ServiciosOfrecidos]') AND name = 'PermitirNegociacion')
BEGIN
    ALTER TABLE tbl_ServiciosOfrecidos ADD PermitirNegociacion BIT DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tbl_ServiciosOfrecidos]') AND name = 'PrecioMinimo')
BEGIN
    ALTER TABLE tbl_ServiciosOfrecidos ADD PrecioMinimo DECIMAL(10, 2) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tbl_ServiciosOfrecidos]') AND name = 'FechaActualizacion')
BEGIN
    ALTER TABLE tbl_ServiciosOfrecidos ADD FechaActualizacion DATETIME DEFAULT GETDATE();
END
GO

-- 2. Update SP: Gestionar Servicio (Insert/Update)
CREATE OR ALTER PROCEDURE sp_GestionarServicioOfrecido
    @Accion NVARCHAR(20),
    @Id UNIQUEIDENTIFIER = NULL,
    @ProveedorId UNIQUEIDENTIFIER,
    @Categoria NVARCHAR(50) = NULL,
    @Titulo NVARCHAR(100) = NULL,
    @Descripcion NVARCHAR(MAX) = NULL,
    @Precio DECIMAL(10,2) = NULL,
    @PrecioTipo NVARCHAR(20) = NULL, -- 'Fijo', 'PorHora', 'Desde'
    @Etiquetas NVARCHAR(MAX) = NULL,
    @CoberturaArea NVARCHAR(MAX) = NULL,
    @Activo BIT = 1,
    @PermitirNegociacion BIT = 0,
    @PrecioMinimo DECIMAL(10,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Accion = 'INSERT'
    BEGIN
        INSERT INTO tbl_ServiciosOfrecidos (
            ProveedorId, Categoria, Titulo, Descripcion, Precio, PrecioTipo, Etiquetas, CoberturaArea, Activo, PermitirNegociacion, PrecioMinimo
        )
        OUTPUT INSERTED.Id
        VALUES (
            @ProveedorId, @Categoria, @Titulo, @Descripcion, @Precio, @PrecioTipo, @Etiquetas, @CoberturaArea, @Activo, @PermitirNegociacion, @PrecioMinimo
        );
    END
    ELSE IF @Accion = 'UPDATE'
    BEGIN
        UPDATE tbl_ServiciosOfrecidos
        SET 
            Categoria = COALESCE(@Categoria, Categoria),
            Titulo = COALESCE(@Titulo, Titulo),
            Descripcion = COALESCE(@Descripcion, Descripcion),
            Precio = COALESCE(@Precio, Precio),
            PrecioTipo = COALESCE(@PrecioTipo, PrecioTipo),
            Etiquetas = COALESCE(@Etiquetas, Etiquetas),
            CoberturaArea = COALESCE(@CoberturaArea, CoberturaArea),
            PermitirNegociacion = COALESCE(@PermitirNegociacion, PermitirNegociacion),
            PrecioMinimo = COALESCE(@PrecioMinimo, PrecioMinimo),
            FechaActualizacion = GETDATE()
        WHERE Id = @Id AND ProveedorId = @ProveedorId;

        SELECT @Id;
    END
    ELSE IF @Accion = 'DELETE'
    BEGIN
        DELETE FROM tbl_ServiciosOfrecidos WHERE Id = @Id AND ProveedorId = @ProveedorId;
        SELECT @Id; -- Return deleted ID
    END
    ELSE IF @Accion = 'TOGGLE'
    BEGIN
        UPDATE tbl_ServiciosOfrecidos
        SET Activo = CASE WHEN Activo = 1 THEN 0 ELSE 1 END
        WHERE Id = @Id AND ProveedorId = @ProveedorId;
        
        SELECT @Id;
    END
END
GO

-- 3. Update SP: Obtener Servicios Proveedor
CREATE OR ALTER PROCEDURE sp_ObtenerServiciosProveedor
    @ProveedorId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM tbl_ServiciosOfrecidos WHERE ProveedorId = @ProveedorId ORDER BY FechaCreacion DESC;
END
GO

-- 4. Update SP: Obtener Servicios Activos (Marketplace)
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
        s.PrecioTipo,
        s.Etiquetas,
        s.CoberturaArea,
        s.Activo,
        s.PermitirNegociacion,
        s.PrecioMinimo,
        s.FechaCreacion,
        s.FechaActualizacion,
        pp.EsPremium
    FROM tbl_ServiciosOfrecidos s
    INNER JOIN tbl_Usuarios u ON s.ProveedorId = u.Id
    LEFT JOIN tbl_ProveedoresPerfil pp ON u.Id = pp.UsuarioId
    WHERE s.Activo = 1
    ORDER BY pp.EsPremium DESC, NEWID();
END
GO
