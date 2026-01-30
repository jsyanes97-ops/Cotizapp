USE CotizappBD;
GO

-- =============================================
-- SP: Gestionar Producto (CRUD)
-- =============================================
CREATE OR ALTER PROCEDURE sp_GestionarProducto
    @Accion NVARCHAR(20), -- 'INSERT', 'UPDATE', 'DELETE', 'TOGGLE'
    @Id UNIQUEIDENTIFIER = NULL,
    @ProveedorId UNIQUEIDENTIFIER,
    @Titulo NVARCHAR(100) = NULL,
    @Descripcion NVARCHAR(MAX) = NULL,
    @Precio DECIMAL(10, 2) = NULL,
    @Condicion NVARCHAR(20) = NULL,
    @Stock INT = NULL,
    @Categoria NVARCHAR(50) = NULL,
    @ImagenesJson NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Accion = 'INSERT'
    BEGIN
        INSERT INTO tbl_Productos
        (ProveedorId, Titulo, Descripcion, Precio, Condicion, Stock, Categoria, ImagenesJson)
        OUTPUT INSERTED.Id
        VALUES 
        (@ProveedorId, @Titulo, @Descripcion, @Precio, @Condicion, @Stock, @Categoria, @ImagenesJson);
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
            ImagenesJson = @ImagenesJson
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

-- =============================================
-- SP: Obtener Productos por Proveedor
-- =============================================
CREATE OR ALTER PROCEDURE sp_ObtenerProductosProveedor
    @ProveedorId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM tbl_Productos
    WHERE ProveedorId = @ProveedorId
    ORDER BY FechaCreacion DESC;
END
GO
