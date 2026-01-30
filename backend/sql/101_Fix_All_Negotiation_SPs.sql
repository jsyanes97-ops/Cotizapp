USE CotizappBD;
GO

-- 1. Helper SP: Create or Get Conversation (ROBUST HYBRID VERSION)
CREATE OR ALTER PROCEDURE sp_GetOrCreateConversation
    @ClienteId UNIQUEIDENTIFIER,
    @ProveedorId UNIQUEIDENTIFIER,
    @TipoRelacion NVARCHAR(20),
    @RelacionId UNIQUEIDENTIFIER,
    @ConversacionId UNIQUEIDENTIFIER = NULL OUTPUT
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

    -- Return for legacy calls that expect a result set (fixes Dapper)
    SELECT @ConversacionId;
END
GO

-- 2. SP: Start Negotiation Service (UPDATED CALL)
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

    -- Create Chat Conversation (FIXED OUTPUT PARAM)
    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Servicio', @ServicioId, @ConversationId = @ConversationId OUTPUT;

    -- Insert Initial Message
    DECLARE @MsgContent NVARCHAR(MAX) = 'Ha iniciado una negociación con una oferta de $' + CAST(@OfertaMonto AS NVARCHAR(20));
    IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

    INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
    VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

    SELECT 'OK' as Status, CAST(@NewId AS NVARCHAR(50)) as Id;
END
GO

-- 3. SP: Start Negotiation Product (UPDATED CALL)
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
    
    -- Create Chat Conversation (FIXED OUTPUT PARAM)
    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Producto', @ProductoId, @ConversationId = @ConversationId OUTPUT;

    -- Insert Initial Message
    DECLARE @MsgContent NVARCHAR(MAX) = 'Ha iniciado una negociación con una oferta de $' + CAST(@OfertaMonto AS NVARCHAR(20));
    IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

    INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
    VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

    SELECT 'OK' as Status, CAST(@NewId AS NVARCHAR(50)) as Id;
END
GO

-- 4. SP: Manage Negotiation (Service) - UPDATED CALL
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

    -- Ensure Conversation Exists (FIXED OUTPUT PARAM)
    EXEC sp_GetOrCreateConversation @ClientId, @ProveedorId, 'Servicio', @ServicioId, @ConversationId = @ConversationId OUTPUT;

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

-- 5. SP: Manage Negotiation (Product) - UPDATED CALL
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

    -- Ensure Conversation Exists (FIXED OUTPUT PARAM)
    EXEC sp_GetOrCreateConversation @ClientId, @ProveedorId, 'Producto', @ProductoId, @ConversationId = @ConversationId OUTPUT;

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
