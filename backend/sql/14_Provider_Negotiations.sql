USE CotizappBD;
GO

-- Helper SP: Create or Get Conversation
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

-- 3. SP: Manage Negotiation (Service) - UPDATED WITH CHAT
CREATE OR ALTER PROCEDURE sp_GestionarNegociacionServicio
    @NegociacionId UNIQUEIDENTIFIER,
    @ProveedorId UNIQUEIDENTIFIER,
    @Accion NVARCHAR(20), -- 'Aceptar', 'Rechazar', 'Contraoferta'
    @MontoContraoferta DECIMAL(10, 2) = NULL,
    @Mensaje NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentState NVARCHAR(20);
    DECLARE @CounterCount INT;
    DECLARE @ClientId UNIQUEIDENTIFIER;
    DECLARE @ServicioId UNIQUEIDENTIFIER;
    DECLARE @ConversationId UNIQUEIDENTIFIER;

    SELECT @CurrentState = Estado, @CounterCount = ContadorContraofertas, @ClientId = ClienteId, @ServicioId = ServicioId
    FROM tbl_NegociacionesServicio
    WHERE Id = @NegociacionId AND ProveedorId = @ProveedorId;

    IF @CurrentState IS NULL
    BEGIN
        SELECT 'ERROR' as Status, 'Negociación no encontrada' as Message;
        RETURN;
    END

    -- Ensure Conversation Exists
    EXEC @ConversationId = sp_GetOrCreateConversation @ClientId, @ProveedorId, 'Servicio', @ServicioId;

    -- Logic
    IF @Accion = 'Aceptar'
    BEGIN
        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Aceptada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;
        
        -- Insert Chat Message
        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ProveedorId, 'Ha aceptado tu oferta.', 'Sistema');
        
        SELECT 'OK' as Status, 'Oferta aceptada' as Message;
    END
    ELSE IF @Accion = 'Rechazar'
    BEGIN
        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Rechazada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        -- Insert Chat Message
        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ProveedorId, 'Ha rechazado tu oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta rechazada' as Message;
    END
    ELSE IF @Accion = 'Contraoferta'
    BEGIN
        -- Check Limit (Max 2 counter-offers)
        IF @CounterCount >= 2
        BEGIN
            SELECT 'ERROR' as Status, 'Has alcanzado el límite de 2 contraofertas.' as Message;
            RETURN;
        END

        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Contraoferta',
            OfertaActual = @MontoContraoferta,
            UltimoEmisorId = @ProveedorId,
            ContadorContraofertas = @CounterCount + 1,
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        -- Insert Chat Message
        DECLARE @MsgContent NVARCHAR(MAX) = 'Ha enviado una contraoferta de $' + CAST(@MontoContraoferta AS NVARCHAR(20));
        IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ProveedorId, @MsgContent, 'Negociacion');

        SELECT 'OK' as Status, 'Contraoferta enviada' as Message;
    END
END
GO

-- 4. SP: Manage Negotiation (Product) - UPDATED WITH CHAT
CREATE OR ALTER PROCEDURE sp_GestionarNegociacionProducto
    @NegociacionId UNIQUEIDENTIFIER,
    @ProveedorId UNIQUEIDENTIFIER,
    @Accion NVARCHAR(20), 
    @MontoContraoferta DECIMAL(10, 2) = NULL,
    @Mensaje NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentState NVARCHAR(20);
    DECLARE @CounterCount INT;
    DECLARE @ClientId UNIQUEIDENTIFIER;
    DECLARE @ProductoId UNIQUEIDENTIFIER;
    DECLARE @ConversationId UNIQUEIDENTIFIER;

    SELECT @CurrentState = Estado, @CounterCount = ContadorContraofertas, @ClientId = ClienteId, @ProductoId = ProductoId
    FROM tbl_NegociacionesProducto
    WHERE Id = @NegociacionId AND ProveedorId = @ProveedorId;

    IF @CurrentState IS NULL
    BEGIN
         SELECT 'ERROR' as Status, 'Negociación no encontrada' as Message;
         RETURN;
    END

    -- Ensure Conversation Exists
    EXEC @ConversationId = sp_GetOrCreateConversation @ClientId, @ProveedorId, 'Producto', @ProductoId;

    IF @Accion = 'Aceptar'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Aceptada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ProveedorId, 'Ha aceptado tu oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta aceptada' as Message;
    END
    ELSE IF @Accion = 'Rechazar'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Rechazada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ProveedorId, 'Ha rechazado tu oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta rechazada' as Message;
    END
    ELSE IF @Accion = 'Contraoferta'
    BEGIN
        IF @CounterCount >= 2
        BEGIN
            SELECT 'ERROR' as Status, 'Has alcanzado el límite de 2 contraofertas.' as Message;
            RETURN;
        END

        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Contraoferta',
            OfertaActual = @MontoContraoferta,
            UltimoEmisorId = @ProveedorId,
            ContadorContraofertas = @CounterCount + 1,
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        -- Insert Chat Message
        DECLARE @MsgContent NVARCHAR(MAX) = 'Ha enviado una contraoferta de $' + CAST(@MontoContraoferta AS NVARCHAR(20));
        IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ProveedorId, @MsgContent, 'Negociacion');

        SELECT 'OK' as Status, 'Contraoferta enviada' as Message;
    END
END
GO
