USE CotizappBD;
GO

-- SP: Start Product Negotiation (with Validation)
CREATE OR ALTER PROCEDURE sp_IniciarNegociacionProducto
    @ProductoId UNIQUEIDENTIFIER,
    @ClienteId UNIQUEIDENTIFIER,
    @OfertaMonto DECIMAL(10, 2),
    @Mensaje NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ProveedorId UNIQUEIDENTIFIER;
    DECLARE @PrecioMinimo DECIMAL(10, 2);
    DECLARE @PrecioOriginal DECIMAL(10, 2);
    DECLARE @PermitirNegociacion BIT;
    DECLARE @Stock INT;

    -- Get Product Details
    SELECT 
        @ProveedorId = ProveedorId,
        @PrecioMinimo = PrecioMinimoNegociable,
        @PrecioOriginal = Precio,
        @PermitirNegociacion = PermitirNegociacion,
        @Stock = Stock
    FROM tbl_Productos
    WHERE Id = @ProductoId;

    -- Validation 1: Does product exist?
    IF @ProveedorId IS NULL
    BEGIN
        SELECT 'ERROR' as Status, 'Producto no encontrado' as Message;
        RETURN;
    END

    -- Validation 2: Is negotiation allowed?
    IF @PermitirNegociacion = 0
    BEGIN
        SELECT 'ERROR' as Status, 'Este producto no permite negociación' as Message;
        RETURN;
    END

    -- Validation 3: Stock Check
    IF @Stock <= 0
    BEGIN
         SELECT 'ERROR' as Status, 'Producto sin stock disponible' as Message;
         RETURN;
    END

    -- Validation 4: Price Limit
    IF @PrecioMinimo IS NOT NULL AND @OfertaMonto < @PrecioMinimo
    BEGIN
        SELECT 'ERROR' as Status, 'La oferta es menor al precio mínimo aceptable por el vendedor' as Message;
        RETURN;
    END

    -- Validation 5: Duplicate Check (Prevent spam)
    IF EXISTS (SELECT 1 FROM tbl_NegociacionesProducto
               WHERE ProductoId = @ProductoId 
               AND ClienteId = @ClienteId 
               AND Estado IN ('Negociando', 'Pendiente', 'Contraoferta'))
    BEGIN
        SELECT 'ERROR' as Status, 'Ya tienes una negociación en curso para este producto.' as Message;
        RETURN;
    END

    -- Insert Negotiation
    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO tbl_NegociacionesProducto (
        Id, ProductoId, ClienteId, ProveedorId, PrecioOriginal, OfertaActual, UltimoEmisorId, Estado
    )
    VALUES (
        @NewId, @ProductoId, @ClienteId, @ProveedorId, @PrecioOriginal, @OfertaMonto, @ClienteId, 'Negociando'
    );
    
    -- Optionally insert initial message into chat tables? 
    -- For now, we assume the Negotiation table is enough to start.

    SELECT 'OK' as Status, CAST(@NewId AS NVARCHAR(50)) as Id;
END
GO
