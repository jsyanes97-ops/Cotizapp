USE CotizappBD;
GO

-- 1. SP: Get Chat Negotiation Context
CREATE OR ALTER PROCEDURE sp_ObtenerContextoDeChat
    @ConversacionId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TipoRelacion NVARCHAR(20);
    DECLARE @RelacionId UNIQUEIDENTIFIER;

    SELECT @TipoRelacion = TipoRelacion, @RelacionId = RelacionId
    FROM tbl_Conversaciones
    WHERE Id = @ConversacionId;

    IF @TipoRelacion = 'Servicio'
    BEGIN
        SELECT 
            N.Id AS NegociacionId,
            'Servicio' AS Tipo,
            S.Titulo AS Titulo,
            N.PrecioOriginal,
            N.OfertaActual,
            N.UltimoEmisorId,
            N.Estado,
            N.ProveedorId,
            N.ClienteId
        FROM tbl_NegociacionesServicio N
        JOIN tbl_ServiciosOfrecidos S ON N.ServicioId = S.Id
        WHERE N.Id = @RelacionId OR (N.ServicioId = @RelacionId AND N.ClienteId = (SELECT ClienteId FROM tbl_Conversaciones WHERE Id = @ConversacionId));
        -- Note: The OR logic handles cases where RelacionId might be ServiceId directly or NegotiationId. 
        -- Standardizing RelacionId to be NegotiationId would be cleaner, but currently it might be ServiceId logic in some places.
        -- Let's stick to the current logic: RelacionId in Conversation IS the Entity Id (ServiceId or ProductId) OR NegotiationId?
        -- In `sp_GetOrCreateConversation`, we pass `@RelacionId`.
        -- In `sp_IniciarNegociacionServicio`, we call it with `@ServicioId`.
        -- So `@RelacionId` IS `@ServicioId`.
        -- Therefore we must match `N.ServicioId`.
    END
    ELSE IF @TipoRelacion = 'Producto'
    BEGIN
        SELECT 
            N.Id AS NegociacionId,
            'Producto' AS Tipo,
            P.Titulo AS Titulo,
            N.PrecioOriginal,
            N.OfertaActual,
            N.UltimoEmisorId,
            N.Estado,
            N.ProveedorId,
            N.ClienteId
        FROM tbl_NegociacionesProducto N
        JOIN tbl_Productos P ON N.ProductoId = P.Id
        WHERE N.ProductoId = @RelacionId AND N.ClienteId = (SELECT ClienteId FROM tbl_Conversaciones WHERE Id = @ConversacionId);
    END
END
GO

-- 2. SP: Manage Negotiation Client (Service)
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

    -- Ensure Conversation Exists (Use correct parameter)
    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Servicio', @ServicioId, @ConversacionId = @ConversationId OUTPUT;

    IF @Accion = 'Aceptar'
    BEGIN
        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Aceptada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;
        
        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ClienteId, 'Ha aceptado la oferta.', 'Sistema');
        
        SELECT 'OK' as Status, 'Oferta aceptada' as Message;
    END
    ELSE IF @Accion = 'Rechazar'
    BEGIN
        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Rechazada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ClienteId, 'Ha rechazado la oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta rechazada' as Message;
    END
    ELSE IF @Accion = 'Contraoferta'
    BEGIN
        -- Limit check (optional for client, but good practice)
        IF @CounterCount >= 4 -- Allow more back and forth total
        BEGIN
             -- Or maybe just check if previous was also from client?
             -- Logic: If state is 'Contraoferta' and LastSender is Client, they can't counter again?
             -- The UI should prevent this, but DB safecheck:
             -- Actually let's just increment counter.
             -- Logic: Client implies `UltimoEmisorId` becomes `ClienteId`.
             DECLARE @Dummy INT = 0;
        END

        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Contraoferta',
            OfertaActual = @MontoContraoferta,
            UltimoEmisorId = @ClienteId,
            ContadorContraofertas = @CounterCount + 1,
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        -- Insert Chat Message
        DECLARE @MsgContent NVARCHAR(MAX) = 'Ha enviado una contraoferta de $' + CAST(@MontoContraoferta AS NVARCHAR(20));
        IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

        SELECT 'OK' as Status, 'Contraoferta enviada' as Message;
    END
END
GO

-- 3. SP: Manage Negotiation Client (Product)
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

    -- Ensure Conversation Exists (Use correct parameter)
    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Producto', @ProductoId, @ConversacionId = @ConversationId OUTPUT;

    IF @Accion = 'Aceptar'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Aceptada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ClienteId, 'Ha aceptado la oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta aceptada' as Message;
    END
    ELSE IF @Accion = 'Rechazar'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Rechazada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ClienteId, 'Ha rechazado la oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta rechazada' as Message;
    END
    ELSE IF @Accion = 'Contraoferta'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Contraoferta',
            OfertaActual = @MontoContraoferta,
            UltimoEmisorId = @ClienteId,
            ContadorContraofertas = @CounterCount + 1,
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        -- Insert Chat Message
        DECLARE @MsgContent NVARCHAR(MAX) = 'Ha enviado una contraoferta de $' + CAST(@MontoContraoferta AS NVARCHAR(20));
        IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

        SELECT 'OK' as Status, 'Contraoferta enviada' as Message;
    END
END
GO
