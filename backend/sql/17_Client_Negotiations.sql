USE CotizappBD;
GO

-- 1. SP: Manage Negotiation Client (Service)
CREATE OR ALTER PROCEDURE sp_GestionarNegociacionClienteServicio
    @NegociacionId UNIQUEIDENTIFIER,
    @ClienteId UNIQUEIDENTIFIER,
    @Accion NVARCHAR(20), -- 'Aceptar', 'Rechazar', 'Contraoferta'
    @MontoContraoferta DECIMAL(10, 2) = NULL,
    @Mensaje NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentState NVARCHAR(20);
    DECLARE @CounterCount INT;
    DECLARE @ProveedorId UNIQUEIDENTIFIER;
    DECLARE @ServicioId UNIQUEIDENTIFIER;
    DECLARE @ConversationId UNIQUEIDENTIFIER;

    SELECT @CurrentState = Estado, @CounterCount = ContadorContraofertas, @ProveedorId = ProveedorId, @ServicioId = ServicioId
    FROM tbl_NegociacionesServicio
    WHERE Id = @NegociacionId AND ClienteId = @ClienteId;

    IF @CurrentState IS NULL
    BEGIN
        SELECT 'ERROR' as Status, 'Negociación no encontrada' as Message;
        RETURN;
    END

    -- Ensure Conversation Exists
    EXEC @ConversationId = sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Servicio', @ServicioId;

    IF @Accion = 'Aceptar'
    BEGIN
        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Aceptada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;
        
        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ClienteId, 'Ha aceptado tu oferta.', 'Sistema');
        
        SELECT 'OK' as Status, 'Oferta aceptada' as Message;
    END
    ELSE IF @Accion = 'Rechazar'
    BEGIN
        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Rechazada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ClienteId, 'Ha rechazado tu oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta rechazada' as Message;
    END
    ELSE IF @Accion = 'Contraoferta'
    BEGIN
        IF @CounterCount >= 2
        BEGIN
            SELECT 'ERROR' as Status, 'Has alcanzado el límite de 2 contraofertas.' as Message;
            RETURN;
        END

        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Contraoferta',
            OfertaActual = @MontoContraoferta,
            UltimoEmisorId = @ClienteId,
            ContadorContraofertas = @CounterCount + 1,
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        DECLARE @MsgContent NVARCHAR(MAX) = 'Ha enviado una contraoferta de $' + CAST(@MontoContraoferta AS NVARCHAR(20));
        IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

        SELECT 'OK' as Status, 'Contraoferta enviada' as Message;
    END
END
GO

-- 2. SP: Manage Negotiation Client (Product)
CREATE OR ALTER PROCEDURE sp_GestionarNegociacionClienteProducto
    @NegociacionId UNIQUEIDENTIFIER,
    @ClienteId UNIQUEIDENTIFIER,
    @Accion NVARCHAR(20), 
    @MontoContraoferta DECIMAL(10, 2) = NULL,
    @Mensaje NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentState NVARCHAR(20);
    DECLARE @CounterCount INT;
    DECLARE @ProveedorId UNIQUEIDENTIFIER;
    DECLARE @ProductoId UNIQUEIDENTIFIER;
    DECLARE @ConversationId UNIQUEIDENTIFIER;

    SELECT @CurrentState = Estado, @CounterCount = ContadorContraofertas, @ProveedorId = ProveedorId, @ProductoId = ProductoId
    FROM tbl_NegociacionesProducto
    WHERE Id = @NegociacionId AND ClienteId = @ClienteId;

    IF @CurrentState IS NULL
    BEGIN
         SELECT 'ERROR' as Status, 'Negociación no encontrada' as Message;
         RETURN;
    END

    EXEC @ConversationId = sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Producto', @ProductoId;

    IF @Accion = 'Aceptar'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Aceptada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ClienteId, 'Ha aceptado tu oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta aceptada' as Message;
    END
    ELSE IF @Accion = 'Rechazar'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Rechazada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ClienteId, 'Ha rechazado tu oferta.', 'Sistema');

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
            UltimoEmisorId = @ClienteId,
            ContadorContraofertas = @CounterCount + 1,
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        DECLARE @MsgContent NVARCHAR(MAX) = 'Ha enviado una contraoferta de $' + CAST(@MontoContraoferta AS NVARCHAR(20));
        IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

        SELECT 'OK' as Status, 'Contraoferta enviada' as Message;
    END
END
GO
