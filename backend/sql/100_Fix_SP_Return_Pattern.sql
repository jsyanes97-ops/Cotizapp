USE CotizappBD;
GO

-- 1. Fix sp_GetOrCreateConversation to use OUTPUT parameter
CREATE OR ALTER PROCEDURE sp_GetOrCreateConversation
    @ClienteId UNIQUEIDENTIFIER,
    @ProveedorId UNIQUEIDENTIFIER,
    @TipoRelacion NVARCHAR(20),
    @RelacionId UNIQUEIDENTIFIER,
    @ConversacionId UNIQUEIDENTIFIER OUTPUT -- CHANGED: Added OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @ConversacionId = Id FROM tbl_Conversaciones
    WHERE ClienteId = @ClienteId AND ProveedorId = @ProveedorId 
      AND TipoRelacion = @TipoRelacion AND RelacionId = @RelacionId;

    IF @ConversacionId IS NULL
    BEGIN
        SET @ConversacionId = NEWID();
        INSERT INTO tbl_Conversaciones (Id, ClienteId, ProveedorId, TipoRelacion, RelacionId)
        VALUES (@ConversacionId, @ClienteId, @ProveedorId, @TipoRelacion, @RelacionId);
    END
END
GO

-- 2. Fix sp_IniciarNegociacionServicio to use OUTPUT
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
    DECLARE @ConversationId UNIQUEIDENTIFIER; -- Var to hold output

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

    -- Create Chat Conversation (FIXED CALL)
    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Servicio', @ServicioId, @ConversationId = @ConversationId OUTPUT;

    -- Insert Initial Message
    DECLARE @MsgContent NVARCHAR(MAX) = 'Ha iniciado una negociación con una oferta de $' + CAST(@OfertaMonto AS NVARCHAR(20));
    IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

    INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
    VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

    SELECT 'OK' as Status, CAST(@NewId AS NVARCHAR(50)) as Id;
END
GO
