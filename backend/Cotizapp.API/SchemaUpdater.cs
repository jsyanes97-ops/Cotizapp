using System;
using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace Cotizapp.API
{
    public class SchemaUpdater
    {
        private readonly string _connectionString;

        public SchemaUpdater(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public void EnsureSchema()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                connection.Open();

                Console.WriteLine("Checking Database Schema...");

                // 1. Fix tbl_Conversaciones.RelacionId
                var checkSql = @"
                    SELECT count(*) 
                    FROM sys.columns 
                    WHERE object_id = OBJECT_ID(N'[dbo].[tbl_Conversaciones]') 
                    AND name = 'RelacionId' 
                    AND system_type_id != 36"; // 36 is UniqueIdentifier

                int count = connection.QueryFirstOrDefault<int>(checkSql);

                if (count > 0)
                {
                    Console.WriteLine("Fixing tbl_Conversaciones.RelacionId (converting to UNIQUEIDENTIFIER)...");
                    
                    var fixSql = @"
                        DECLARE @TableName NVARCHAR(MAX) = 'tbl_Conversaciones';
                        DECLARE @ColName NVARCHAR(MAX) = 'RelacionId';
                        DECLARE @Sql NVARCHAR(MAX) = '';

                        -- Drop Constraints
                        SELECT @Sql += 'ALTER TABLE ' + @TableName + ' DROP CONSTRAINT ' + name + ';'
                        FROM sys.default_constraints
                        WHERE parent_object_id = OBJECT_ID(@TableName)
                        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID(@TableName) AND name = @ColName);

                        -- Drop Indexes
                        SELECT @Sql += 'DROP INDEX ' + name + ' ON ' + @TableName + ';'
                        FROM sys.indexes
                        WHERE object_id = OBJECT_ID(@TableName)
                        AND index_id IN (SELECT index_id FROM sys.index_columns WHERE object_id = OBJECT_ID(@TableName) AND column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID(@TableName) AND name = @ColName));

                        IF @Sql != '' EXEC sp_executesql @Sql;

                        ALTER TABLE tbl_Conversaciones DROP COLUMN RelacionId;
                        ALTER TABLE tbl_Conversaciones ADD RelacionId UNIQUEIDENTIFIER NULL;
                    ";
                    connection.Execute(fixSql);
                    Console.WriteLine("tbl_Conversaciones.RelacionId Fixed.");
                }

                // 2. Fix tbl_NegociacionesServicio.UltimoEmisorId
                var checkSql2 = @"
                    SELECT count(*) 
                    FROM sys.columns 
                    WHERE object_id = OBJECT_ID(N'[dbo].[tbl_NegociacionesServicio]') 
                    AND name = 'UltimoEmisorId' 
                    AND system_type_id != 36";

                int count2 = connection.QueryFirstOrDefault<int>(checkSql2);

                if (count2 > 0)
                {
                    Console.WriteLine("Fixing tbl_NegociacionesServicio.UltimoEmisorId...");
                    connection.Execute("ALTER TABLE tbl_NegociacionesServicio ALTER COLUMN UltimoEmisorId UNIQUEIDENTIFIER");
                    Console.WriteLine("tbl_NegociacionesServicio.UltimoEmisorId Fixed.");
                }

                // 2.3 Visibility flags for tbl_Conversaciones (Soft Delete)
                var checkSql3 = @"
                    SELECT count(*) 
                    FROM sys.columns 
                    WHERE object_id = OBJECT_ID(N'[dbo].[tbl_Conversaciones]') 
                    AND name = 'VisibleParaCliente'";
                
                int count3 = connection.QueryFirstOrDefault<int>(checkSql3);
                if (count3 == 0)
                {
                    Console.WriteLine("Adding visibility flags to tbl_Conversaciones...");
                    connection.Execute("ALTER TABLE tbl_Conversaciones ADD VisibleParaCliente BIT NOT NULL DEFAULT 1");
                    connection.Execute("ALTER TABLE tbl_Conversaciones ADD VisibleParaProveedor BIT NOT NULL DEFAULT 1");
                    Console.WriteLine("Visibility flags added.");
                }

                Console.WriteLine("Schema Verification Complete.");
                
                // 3. Ensure SPs are correct (Nuclear Option: Fix ALL Negotiation SPs)
                
                // 3.1 sp_GetOrCreateConversation
                var spGetOrCreate = @"
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

    -- Return for legacy/Dapper compatibility
    SELECT @ConversacionId;
END";
                // 3. Ensure SPs are correct (Nuclear Option: Fix ALL Negotiation SPs)
                
                // 5. SP: Get User Conversations (Client or Provider) - UPDATED
                var spGetConversations = @"
CREATE OR ALTER PROCEDURE sp_ObtenerConversacionesUsuario
    @UsuarioId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.Id,
        c.ClienteId,
        c.ProveedorId,
        c.TipoRelacion,
        c.RelacionId,
        u.Nombre as InterviewerName, 
        (SELECT TOP 1 Contenido FROM tbl_MensajesChat WHERE ConversacionId = c.Id ORDER BY FechaEnvio DESC) as LastMessage,
        (SELECT TOP 1 FechaEnvio FROM tbl_MensajesChat WHERE ConversacionId = c.Id ORDER BY FechaEnvio DESC) as LastMessageTime,
        (SELECT COUNT(*) FROM tbl_MensajesChat WHERE ConversacionId = c.Id AND Leido = 0 AND EmisorId != @UsuarioId) as UnreadCount,
        CASE 
            WHEN c.TipoRelacion = 'Servicio' THEN (SELECT Titulo FROM tbl_ServiciosOfrecidos WHERE Id = c.RelacionId)
            WHEN c.TipoRelacion = 'Producto' THEN (SELECT Titulo FROM tbl_Productos WHERE Id = c.RelacionId)
            ELSE 'Desconocido'
        END as ServiceCategory,
        -- Quoted Price
        CASE 
             WHEN c.TipoRelacion = 'Servicio' THEN (SELECT TOP 1 OfertaActual FROM tbl_NegociacionesServicio WHERE ServicioId = c.RelacionId AND ClienteId = c.ClienteId ORDER BY FechaActualizacion DESC)
             WHEN c.TipoRelacion = 'Producto' THEN (SELECT TOP 1 OfertaActual FROM tbl_NegociacionesProducto WHERE ProductoId = c.RelacionId AND ClienteId = c.ClienteId ORDER BY FechaActualizacion DESC)
             ELSE 0
        END as QuotedPrice,
        -- Negotiation ID
        CASE 
             WHEN c.TipoRelacion = 'Servicio' THEN (SELECT TOP 1 Id FROM tbl_NegociacionesServicio WHERE ServicioId = c.RelacionId AND ClienteId = c.ClienteId ORDER BY FechaActualizacion DESC)
             WHEN c.TipoRelacion = 'Producto' THEN (SELECT TOP 1 Id FROM tbl_NegociacionesProducto WHERE ProductoId = c.RelacionId AND ClienteId = c.ClienteId ORDER BY FechaActualizacion DESC)
             ELSE NULL
        END as NegotiationId,
        CASE 
             WHEN c.TipoRelacion = 'Servicio' THEN (SELECT TOP 1 Estado FROM tbl_NegociacionesServicio WHERE ServicioId = c.RelacionId AND ClienteId = c.ClienteId ORDER BY FechaActualizacion DESC)
             WHEN c.TipoRelacion = 'Producto' THEN (SELECT TOP 1 Estado FROM tbl_NegociacionesProducto WHERE ProductoId = c.RelacionId AND ClienteId = c.ClienteId ORDER BY FechaActualizacion DESC)
             ELSE 'active'
        END as Status,
        -- Negotiation Counter
        CASE 
             WHEN c.TipoRelacion = 'Servicio' THEN (SELECT TOP 1 ContadorContraofertas FROM tbl_NegociacionesServicio WHERE ServicioId = c.RelacionId AND ClienteId = c.ClienteId ORDER BY FechaActualizacion DESC)
             WHEN c.TipoRelacion = 'Producto' THEN (SELECT TOP 1 ContadorContraofertas FROM tbl_NegociacionesProducto WHERE ProductoId = c.RelacionId AND ClienteId = c.ClienteId ORDER BY FechaActualizacion DESC)
             ELSE 0
        END as NegotiationCounter
    FROM tbl_Conversaciones c
    JOIN tbl_Usuarios u ON (c.ClienteId = u.Id OR c.ProveedorId = u.Id)
    WHERE (c.ClienteId = @UsuarioId OR c.ProveedorId = @UsuarioId)
      AND u.Id != @UsuarioId 
      AND (
          (c.ClienteId = @UsuarioId AND c.VisibleParaCliente = 1) OR
          (c.ProveedorId = @UsuarioId AND c.VisibleParaProveedor = 1)
      )
    ORDER BY LastMessageTime DESC;
END";
                connection.Execute(spGetConversations);
                Console.WriteLine("sp_ObtenerConversacionesUsuario Refreshed.");

                // 2.2 sp_MarcarMensajesComoLeidos
                var spMarcarLeidos = @"
CREATE OR ALTER PROCEDURE sp_MarcarMensajesComoLeidos
    @ConversacionId UNIQUEIDENTIFIER,
    @UsuarioId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Mark all messages in this conversation as read for the current user
    -- (messages sent by others, not by the user themselves)
    UPDATE tbl_MensajesChat
    SET Leido = 1
    WHERE ConversacionId = @ConversacionId
      AND EmisorId != @UsuarioId
      AND Leido = 0;
      
    SELECT @@ROWCOUNT as MessagesMarked;
END";
                connection.Execute(spMarcarLeidos);
                Console.WriteLine("sp_MarcarMensajesComoLeidos Refreshed.");
                var spIniciarServicio = @"
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
    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Servicio', @ServicioId, @ConversacionId = @ConversationId OUTPUT;

    -- Insert Initial Message
    DECLARE @MsgContent NVARCHAR(MAX) = 'Ha iniciado una negociación con una oferta de $' + CAST(@OfertaMonto AS NVARCHAR(20));
    IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

    INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
    VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

    SELECT 'OK' as Status, CAST(@NewId AS NVARCHAR(50)) as Id;
END";
                connection.Execute(spIniciarServicio);
                Console.WriteLine("sp_IniciarNegociacionServicio Refreshed.");

                // 3.3 sp_IniciarNegociacionProducto
                var spIniciarProducto = @"
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
    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Producto', @ProductoId, @ConversacionId = @ConversationId OUTPUT;

    -- Insert Initial Message
    DECLARE @MsgContent NVARCHAR(MAX) = 'Ha iniciado una negociación con una oferta de $' + CAST(@OfertaMonto AS NVARCHAR(20));
    IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

    INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
    VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

    SELECT 'OK' as Status, CAST(@NewId AS NVARCHAR(50)) as Id;
END";
                connection.Execute(spIniciarProducto);
                Console.WriteLine("sp_IniciarNegociacionProducto Refreshed.");

                // ... (Existing blocks)

                // 4. Client Negotiation Actions
                 var spClientActions = @"
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
END;

-- 2. SP: Manage Negotiation Client (Servicio)
CREATE OR ALTER PROCEDURE sp_GestionarNegociacionClienteServicio
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
        IF @CounterCount >= 3
        BEGIN
             SELECT 'ERROR' as Status, 'Se ha alcanzado el límite de contraofertas. Debes aceptar o rechazar.' as Message;
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
END;

-- 3. SP: Manage Negotiation Client (Producto)
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
        IF @CounterCount >= 4
        BEGIN
             SELECT 'ERROR' as Status, 'Se ha alcanzado el límite de contraofertas. Debes aceptar o rechazar.' as Message;
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
END;
";
            
            // Split by GO is redundant here as Execute handles it if it's one batch, but Dapper can be tricky with GO. 
            // Better to replace GO with empty string if passing as single command? No, Dapper usually fails with GO.
            // I should have removed GO in the string above or executed separately.
            // I'll execute them as one block without GO, or use a helper to split.
            // Since I'm embedding it, I will remove the GO commands from the string literal above.
            
            // ... Actually dapper doesn't support GO. I must split manually or just assume one batch if MSSQL supports it.
            // MSSQL supports multiple CREATE PROC in one batch ONLY if they are the first statement, which they are not here.
            // So these MUST be executed separately.
            
            // Simplification: I'll just execute sp_ObtenerContextoDeChat, then sp_GestionarNegociacionClienteServicio, etc separately.
            
            var spContext = @"CREATE OR ALTER PROCEDURE sp_ObtenerContextoDeChat
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
        SELECT TOP 1
            N.Id AS NegociacionId,
            'Servicio' AS Tipo,
            S.Titulo AS Titulo,
            N.PrecioOriginal,
            N.OfertaActual,
            N.UltimoEmisorId,
            N.Estado,
            N.ProveedorId,
            N.ClienteId,
            N.ContadorContraofertas
        FROM tbl_NegociacionesServicio N
        JOIN tbl_ServiciosOfrecidos S ON N.ServicioId = S.Id
        WHERE N.Id = @RelacionId OR (N.ServicioId = @RelacionId AND N.ClienteId = (SELECT ClienteId FROM tbl_Conversaciones WHERE Id = @ConversacionId))
        ORDER BY N.FechaActualizacion DESC;
    END
    ELSE IF @TipoRelacion = 'Producto'
    BEGIN
        SELECT TOP 1
            N.Id AS NegociacionId,
            'Producto' AS Tipo,
            P.Titulo AS Titulo,
            N.PrecioOriginal,
            N.OfertaActual,
            N.UltimoEmisorId,
            N.Estado,
            N.ProveedorId,
            N.ClienteId,
            N.ContadorContraofertas
        FROM tbl_NegociacionesProducto N
        JOIN tbl_Productos P ON N.ProductoId = P.Id
        WHERE N.ProductoId = @RelacionId AND N.ClienteId = (SELECT ClienteId FROM tbl_Conversaciones WHERE Id = @ConversacionId)
        ORDER BY N.FechaActualizacion DESC;
    END
END";
            
            connection.Execute(spContext);
            Console.WriteLine("sp_ObtenerContextoDeChat Refreshed.");

            var spEliminar = @"CREATE OR ALTER PROCEDURE sp_EliminarConversacion
    @ConversacionId UNIQUEIDENTIFIER,
    @UsuarioId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE tbl_Conversaciones
    SET VisibleParaCliente = CASE WHEN ClienteId = @UsuarioId THEN 0 ELSE VisibleParaCliente END,
        VisibleParaProveedor = CASE WHEN ProveedorId = @UsuarioId THEN 0 ELSE VisibleParaProveedor END
    WHERE Id = @ConversacionId;
END";
            connection.Execute(spEliminar);
            Console.WriteLine("sp_EliminarConversacion created.");


            var spClientServ = @"CREATE OR ALTER PROCEDURE sp_GestionarNegociacionClienteServicio
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
        IF @CounterCount >= 3
        BEGIN
             SELECT 'ERROR' as Status, 'Se ha alcanzado el límite de contraofertas. Debes aceptar o rechazar.' as Message;
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
END";
            
            connection.Execute(spClientServ);
            Console.WriteLine("sp_GestionarNegociacionClienteServicio Refreshed.");
            
            var spClientProd = @"CREATE OR ALTER PROCEDURE sp_GestionarNegociacionClienteProducto
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
        IF @CounterCount >= 3
        BEGIN
             SELECT 'ERROR' as Status, 'Se ha alcanzado el límite de contraofertas. Debes aceptar o rechazar.' as Message;
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
END";

            connection.Execute(spClientProd);
            Console.WriteLine("sp_GestionarNegociacionClienteProducto Refreshed.");
                var spGestionarServicio = @"
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
    EXEC sp_GetOrCreateConversation @ClientId, @ProveedorId, 'Servicio', @ServicioId, @ConversacionId = @ConversationId OUTPUT;

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
        -- Check Limit (Max 5 total counter-offers/messages)
        IF @CounterCount >= 3
        BEGIN
            SELECT 'ERROR' as Status, 'Se ha alcanzado el límite de contraofertas. El cliente debe aceptar o rechazar.' as Message;
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
END";
                connection.Execute(spGestionarServicio);
                Console.WriteLine("sp_GestionarNegociacionServicio Refreshed.");

                // 3.5 sp_GestionarNegociacionProducto
                var spGestionarProducto = @"
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
    EXEC sp_GetOrCreateConversation @ClientId, @ProveedorId, 'Producto', @ProductoId, @ConversacionId = @ConversationId OUTPUT;

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
        IF @CounterCount >= 3
        BEGIN
            SELECT 'ERROR' as Status, 'Se ha alcanzado el límite de contraofertas. El cliente debe aceptar o rechazar.' as Message;
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
        VALUES (@ConversationId, @ProveedorId, 'Ha enviado una contraoferta', 'Negociacion');

        SELECT 'OK' as Status, 'Contraoferta enviada' as Message;
    END
END";
                connection.Execute(spGestionarProducto);
                Console.WriteLine("sp_GestionarNegociacionProducto Refreshed.");

                // 3.6 sp_ObtenerNegociacionesProveedor
                var spObtenerNegocProv = @"
CREATE OR ALTER PROCEDURE sp_ObtenerNegociacionesProveedor
    @ProveedorId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        'Servicio' as TipoRelacion,
        N.Id,
        S.Id as ItemId,
        S.Titulo as ItemTitulo,
        U.Nombre as ClienteNombre,
        N.PrecioOriginal,
        N.OfertaActual,
        N.UltimoEmisorId,
        N.Estado,
        N.ContadorContraofertas,
        N.FechaActualizacion
    FROM tbl_NegociacionesServicio N
    JOIN tbl_ServiciosOfrecidos S ON N.ServicioId = S.Id
    JOIN tbl_Usuarios U ON N.ClienteId = U.Id
    WHERE S.ProveedorId = @ProveedorId

    UNION ALL

    SELECT 
        'Producto' as TipoRelacion,
        N.Id,
        P.Id as ItemId,
        P.Titulo as ItemTitulo,
        U.Nombre as ClienteNombre,
        N.PrecioOriginal,
        N.OfertaActual,
        N.UltimoEmisorId,
        N.Estado,
        N.ContadorContraofertas,
        N.FechaActualizacion
    FROM tbl_NegociacionesProducto N
    JOIN tbl_Productos P ON N.ProductoId = P.Id
    JOIN tbl_Usuarios U ON N.ClienteId = U.Id
    WHERE P.ProveedorId = @ProveedorId
    
    ORDER BY FechaActualizacion DESC;
END";
                connection.Execute(spObtenerNegocProv);
                Console.WriteLine("sp_ObtenerNegociacionesProveedor Created/Updated.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Schema Update Error: {ex.Message}");
            }
        }
    }
}
