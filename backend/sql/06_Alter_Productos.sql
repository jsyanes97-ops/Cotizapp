USE CotizappBD;
GO

-- =============================================
-- Alter Table: tbl_Productos
-- Add missing columns for frontend parity
-- =============================================

IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'PrecioOriginal' AND Object_ID = Object_ID(N'tbl_Productos'))
BEGIN
    ALTER TABLE tbl_Productos ADD PrecioOriginal DECIMAL(10, 2);
    ALTER TABLE tbl_Productos ADD PermitirNegociacion BIT DEFAULT 0;
    ALTER TABLE tbl_Productos ADD PrecioMinimoNegociable DECIMAL(10, 2);
    ALTER TABLE tbl_Productos ADD Etiquetas NVARCHAR(200);
    ALTER TABLE tbl_Productos ADD EspecificacionesJson NVARCHAR(MAX);
END
GO

-- =============================================
-- SP: Gestionar Producto (Update to include new fields)
-- =============================================
CREATE OR ALTER PROCEDURE sp_GestionarProducto
    @Accion NVARCHAR(20), 
    @Id UNIQUEIDENTIFIER = NULL,
    @ProveedorId UNIQUEIDENTIFIER,
    @Titulo NVARCHAR(100) = NULL,
    @Descripcion NVARCHAR(MAX) = NULL,
    @Precio DECIMAL(10, 2) = NULL,
    @Condicion NVARCHAR(20) = NULL,
    @Stock INT = NULL,
    @Categoria NVARCHAR(50) = NULL,
    @ImagenesJson NVARCHAR(MAX) = NULL,
    -- New Params
    @PrecioOriginal DECIMAL(10, 2) = NULL,
    @PermitirNegociacion BIT = 0,
    @PrecioMinimoNegociable DECIMAL(10, 2) = NULL,
    @Etiquetas NVARCHAR(200) = NULL,
    @EspecificacionesJson NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Accion = 'INSERT'
    BEGIN
        INSERT INTO tbl_Productos
        (ProveedorId, Titulo, Descripcion, Precio, Condicion, Stock, Categoria, ImagenesJson, 
         PrecioOriginal, PermitirNegociacion, PrecioMinimoNegociable, Etiquetas, EspecificacionesJson)
        OUTPUT INSERTED.Id
        VALUES 
        (@ProveedorId, @Titulo, @Descripcion, @Precio, @Condicion, @Stock, @Categoria, @ImagenesJson,
         @PrecioOriginal, @PermitirNegociacion, @PrecioMinimoNegociable, @Etiquetas, @EspecificacionesJson);
    END
    ELSE IF @Accion = 'UPDATE'
    BEGIN
        UPDATE tbl_Productos
        SET Titulo = @Titulo,
            Descripcion = @Descripcion,
            Precio = @Precio,
            Condicion = @Condicion,
            Stock = @Stock,
            Categoria = @Categoria,
            ImagenesJson = @ImagenesJson,
            -- Update new fields
            PrecioOriginal = @PrecioOriginal,
            PermitirNegociacion = @PermitirNegociacion,
            PrecioMinimoNegociable = @PrecioMinimoNegociable,
            Etiquetas = @Etiquetas,
            EspecificacionesJson = @EspecificacionesJson
        WHERE Id = @Id AND ProveedorId = @ProveedorId;
    END
    ELSE IF @Accion = 'DELETE'
    BEGIN
        DELETE FROM tbl_Productos
        WHERE Id = @Id AND ProveedorId = @ProveedorId;
    END
    ELSE IF @Accion = 'TOGGLE'
    BEGIN
        UPDATE tbl_Productos
        SET Activo = ~Activo
        WHERE Id = @Id AND ProveedorId = @ProveedorId;
    END
END
GO
