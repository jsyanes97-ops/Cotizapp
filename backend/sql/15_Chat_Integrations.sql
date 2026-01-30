USE CotizappBD;
GO

-- 1. SP: Start Negotiation Service (UPDATED)
CREATE OR ALTER PROCEDURE sp_IniciarNegociacionServicio
    @ServicioId UNIQUEIDENTIFIER,
    @ClienteId UNIQUEIDENTIFIER,
    @OfertaMonto DECIMAL(10, 2),
    @Mensaje NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ProveedorId UNIQUEIDENTIFIER;
    DECLARE @PrecioMinimo DECIMAL(10, 2);
    DECLARE @PrecioOriginal DECIMAL(10, 2);
    DECLARE @PermitirNegociacion BIT;
    DECLARE @ConversationId UNIQUEIDENTIFIER;

    -- Get Service Details
    SELECT 
        @ProveedorId = ProveedorId,
        @PrecioMinimo = PrecioMinimo,
        @PrecioOriginal = Precio,
        @PermitirNegociacion = PermitirNegociacion
    FROM tbl_ServiciosOfrecidos
    WHERE Id = @ServicioId;

    -- Validations
    IF @ProveedorId IS NULL
    BEGIN
        SELECT 'ERROR' as Status, 'Servicio no encontrado' as Message;
        RETURN;
    END

    IF @PermitirNegociacion = 0
    BEGIN
        SELECT 'ERROR' as Status, 'Este servicio no permite negociación' as Message;
        RETURN;
    END

    IF @PrecioMinimo IS NOT NULL AND @OfertaMonto < @PrecioMinimo
    BEGIN
        SELECT 'ERROR' as Status, 'La oferta es menor al precio mínimo aceptable por el proveedor' as Message;
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM tbl_NegociacionesServicio 
               WHERE ServicioId = @ServicioId 
               AND ClienteId = @ClienteId 
               AND Estado IN ('Pendiente', 'Contraoferta'))
    BEGIN
        SELECT 'ERROR' as Status, 'Ya tienes una negociación en curso para este servicio.' as Message;
        RETURN;
    END

    -- Insert Negotiation
    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO tbl_NegociacionesServicio (
        Id, ServicioId, ClienteId, ProveedorId, PrecioOriginal, OfertaActual, UltimoEmisorId, Estado, MensajeInicial
    )
    VALUES (
        @NewId, @ServicioId, @ClienteId, @ProveedorId, @PrecioOriginal, @OfertaMonto, @ClienteId, 'Pendiente', @Mensaje
    );

    -- Create Chat Conversation
    EXEC @ConversationId = sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Servicio', @ServicioId;

    -- Insert Initial Message
    DECLARE @MsgContent NVARCHAR(MAX) = 'Ha iniciado una negociación con una oferta de $' + CAST(@OfertaMonto AS NVARCHAR(20));
    IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

    INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
    VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

    SELECT 'OK' as Status, CAST(@NewId AS NVARCHAR(50)) as Id;
END
GO

-- 2. SP: Start Negotiation Product (UPDATED)
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
    DECLARE @ConversationId UNIQUEIDENTIFIER;

    -- Get Product Details
    SELECT 
        @ProveedorId = ProveedorId,
        @PrecioMinimo = PrecioMinimoNegociable,
        @PrecioOriginal = Precio,
        @PermitirNegociacion = PermitirNegociacion,
        @Stock = Stock
    FROM tbl_Productos
    WHERE Id = @ProductoId;

    -- Validations
    IF @ProveedorId IS NULL
    BEGIN
        SELECT 'ERROR' as Status, 'Producto no encontrado' as Message;
        RETURN;
    END

    IF @PermitirNegociacion = 0
    BEGIN
        SELECT 'ERROR' as Status, 'Este producto no permite negociación' as Message;
        RETURN;
    END

    IF @Stock <= 0
    BEGIN
         SELECT 'ERROR' as Status, 'Producto sin stock disponible' as Message;
         RETURN;
    END

    IF @PrecioMinimo IS NOT NULL AND @OfertaMonto < @PrecioMinimo
    BEGIN
        SELECT 'ERROR' as Status, 'La oferta es menor al precio mínimo aceptable por el vendedor' as Message;
        RETURN;
    END

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
    
    -- Create Chat Conversation
    EXEC @ConversationId = sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Producto', @ProductoId;

    -- Insert Initial Message
    DECLARE @MsgContent NVARCHAR(MAX) = 'Ha iniciado una negociación con una oferta de $' + CAST(@OfertaMonto AS NVARCHAR(20));
    IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

    INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
    VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

    SELECT 'OK' as Status, CAST(@NewId AS NVARCHAR(50)) as Id;
END
GO
