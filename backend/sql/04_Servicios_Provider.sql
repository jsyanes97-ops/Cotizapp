USE CotizappBD;
GO

-- =============================================
-- 6. Provider Services Catalog
-- =============================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_ServiciosOfrecidos' AND xtype='U')
CREATE TABLE tbl_ServiciosOfrecidos (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProveedorId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    Categoria NVARCHAR(50) NOT NULL,
    Titulo NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(MAX) NOT NULL,
    Precio DECIMAL(10, 2) NOT NULL,
    PrecioTipo NVARCHAR(20) NOT NULL, -- 'fixed', 'starting-from', 'per-hour'
    Etiquetas NVARCHAR(200), -- Comma separated
    CoberturaArea NVARCHAR(MAX), -- Comma separated
    Activo BIT DEFAULT 1,
    FechaCreacion DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- SP: Gestionar Servicio Ofrecido
-- =============================================
CREATE OR ALTER PROCEDURE sp_GestionarServicioOfrecido
    @Accion NVARCHAR(20), -- 'INSERT', 'UPDATE', 'DELETE', 'TOGGLE'
    @Id UNIQUEIDENTIFIER = NULL,
    @ProveedorId UNIQUEIDENTIFIER,
    @Categoria NVARCHAR(50) = NULL,
    @Titulo NVARCHAR(100) = NULL,
    @Descripcion NVARCHAR(MAX) = NULL,
    @Precio DECIMAL(10, 2) = NULL,
    @PrecioTipo NVARCHAR(20) = NULL,
    @Etiquetas NVARCHAR(200) = NULL,
    @CoberturaArea NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Accion = 'INSERT'
    BEGIN
        INSERT INTO tbl_ServiciosOfrecidos 
        (ProveedorId, Categoria, Titulo, Descripcion, Precio, PrecioTipo, Etiquetas, CoberturaArea)
        OUTPUT INSERTED.Id
        VALUES 
        (@ProveedorId, @Categoria, @Titulo, @Descripcion, @Precio, @PrecioTipo, @Etiquetas, @CoberturaArea);
    END
    ELSE IF @Accion = 'UPDATE'
    BEGIN
        UPDATE tbl_ServiciosOfrecidos
        SET Categoria = @Categoria,
            Titulo = @Titulo,
            Descripcion = @Descripcion,
            Precio = @Precio,
            PrecioTipo = @PrecioTipo,
            Etiquetas = @Etiquetas,
            CoberturaArea = @CoberturaArea
        WHERE Id = @Id AND ProveedorId = @ProveedorId;
    END
    ELSE IF @Accion = 'DELETE'
    BEGIN
        DELETE FROM tbl_ServiciosOfrecidos
        WHERE Id = @Id AND ProveedorId = @ProveedorId;
    END
    ELSE IF @Accion = 'TOGGLE'
    BEGIN
        UPDATE tbl_ServiciosOfrecidos
        SET Activo = ~Activo
        WHERE Id = @Id AND ProveedorId = @ProveedorId;
    END
END
GO

-- =============================================
-- SP: Obtener Servicios por Proveedor
-- =============================================
CREATE OR ALTER PROCEDURE sp_ObtenerServiciosProveedor
    @ProveedorId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM tbl_ServiciosOfrecidos
    WHERE ProveedorId = @ProveedorId
    ORDER BY FechaCreacion DESC;
END
GO
