USE CotizappBD;
GO

-- 1. Fix tbl_Conversaciones.RelacionId if it is not UNIQUEIDENTIFIER
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[tbl_Conversaciones]') 
    AND name = 'RelacionId' 
    AND system_type_id != 36 -- 36 is UNIQUEIDENTIFIER
)
BEGIN
    -- Drop constraints if any (Foreign Keys usually not on polymorphic column, but check default)
    -- This is a 'hard' fix. If it fails due to conversion, we drop column and recreate.
    ALTER TABLE tbl_Conversaciones DROP COLUMN RelacionId;
    ALTER TABLE tbl_Conversaciones ADD RelacionId UNIQUEIDENTIFIER NULL;
END
GO

-- 2. Fix tbl_NegociacionesServicio.UltimoEmisorId if it is not UNIQUEIDENTIFIER
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[tbl_NegociacionesServicio]') 
    AND name = 'UltimoEmisorId' 
    AND system_type_id != 36
)
BEGIN
    ALTER TABLE tbl_NegociacionesServicio ALTER COLUMN UltimoEmisorId UNIQUEIDENTIFIER;
END
GO

-- 3. Fix tbl_NegociacionesServicio.ServicioId if it is not UNIQUEIDENTIFIER
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[tbl_NegociacionesServicio]') 
    AND name = 'ServicioId' 
    AND system_type_id != 36
)
BEGIN
    -- This is a FK, might require dropping constraints first. 
    -- Assuming worst case, user might need to recreate table if this is complex.
    -- But usually it's correct from creation.
    PRINT 'Warning: ServicioId is not UNIQUEIDENTIFIER. Manual intervention might be needed if FK exists.';
END
GO

-- 4. Re-deploy sp_GetOrCreateConversation to ensure parameters are correct
CREATE OR ALTER PROCEDURE sp_GetOrCreateConversation
    @ClienteId UNIQUEIDENTIFIER,
    @ProveedorId UNIQUEIDENTIFIER,
    @TipoRelacion NVARCHAR(20),
    @RelacionId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ConversacionId UNIQUEIDENTIFIER;

    SELECT @ConversacionId = Id FROM tbl_Conversaciones
    WHERE ClienteId = @ClienteId AND ProveedorId = @ProveedorId 
      AND TipoRelacion = @TipoRelacion AND RelacionId = @RelacionId;

    IF @ConversacionId IS NULL
    BEGIN
        SET @ConversacionId = NEWID();
        INSERT INTO tbl_Conversaciones (Id, ClienteId, ProveedorId, TipoRelacion, RelacionId)
        VALUES (@ConversacionId, @ClienteId, @ProveedorId, @TipoRelacion, @RelacionId);
    END

    SELECT @ConversacionId;
END
GO

-- 5. Re-deploy sp_IniciarNegociacionServicio
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

    -- Safe Check for duplicates (returning 1 is fine, no type clash usually, but using CAST just in case)
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
    
    -- Ensure correct types in INSERT
    INSERT INTO tbl_NegociacionesServicio (
        Id, ServicioId, ClienteId, ProveedorId, PrecioOriginal, OfertaActual, UltimoEmisorId, Estado, MensajeInicial
    )
    VALUES (
        @NewId, 
        @ServicioId, 
        @ClienteId, 
        @ProveedorId, 
        @PrecioOriginal, 
        @OfertaMonto, 
        @ClienteId, -- UltimoEmisorId (Client)
        'Pendiente', 
        @Mensaje
    );

    -- Create Chat Conversation
    -- Pass parameters explicitly typed
    EXEC @ConversationId = sp_GetOrCreateConversation 
        @ClienteId = @ClienteId, 
        @ProveedorId = @ProveedorId, 
        @TipoRelacion = 'Servicio', 
        @RelacionId = @ServicioId; -- RelacionId is ServiceId (Guid)

    -- Insert Initial Message
    DECLARE @MsgContent NVARCHAR(MAX) = 'Ha iniciado una negociación con una oferta de $' + CAST(@OfertaMonto AS NVARCHAR(20));
    IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

    INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
    VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

    SELECT 'OK' as Status, CAST(@NewId AS NVARCHAR(50)) as Id;
END
GO
