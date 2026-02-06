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

                // 3. Ensure Request Expiration Logic (5 mins) & Cleanup
                Console.WriteLine("Updating Request Expiration Logic & Cleaning old data...");
                
                // 3.1 Cleanup old bad data (created with 24h expiration) - One time fix for legacy data
                var cleanupDataSql = @"
                    -- First delete related quotes (FK Constraint)
                    DELETE FROM tbl_CotizacionesServicio
                    WHERE SolicitudId IN (
                        SELECT Id FROM tbl_SolicitudesServicio 
                        WHERE FechaCreacion < DATEADD(HOUR, -1, GETDATE()) 
                        AND Estado = 'Abierta'
                    );

                    -- Then delete the requests
                    DELETE FROM tbl_SolicitudesServicio
                    WHERE FechaCreacion < DATEADD(HOUR, -1, GETDATE())
                    AND Estado = 'Abierta'";
                int deleted = connection.Execute(cleanupDataSql);
                if (deleted > 0) Console.WriteLine($"Cleaned {deleted} expired/old requests.");
                
                // 3.2 Update Creation SP to use 5 minutes
                 var updateSP = @"
                    CREATE OR ALTER PROCEDURE sp_CrearSolicitudServicio
                        @ClienteId UNIQUEIDENTIFIER,
                        @Categoria NVARCHAR(50),
                        @Descripcion NVARCHAR(MAX),
                        @FotosJson NVARCHAR(MAX),
                        @RespuestasGuiadasJson NVARCHAR(MAX),
                        @UbicacionLat FLOAT,
                        @UbicacionLng FLOAT,
                        @UbicacionDireccion NVARCHAR(200)
                    AS
                    BEGIN
                        SET NOCOUNT ON;

                        INSERT INTO tbl_SolicitudesServicio 
                        (ClienteId, Categoria, Descripcion, FotosJson, RespuestasGuiadasJson, UbicacionLat, UbicacionLng, UbicacionDireccion, FechaExpiracion)
                        OUTPUT INSERTED.Id
                        VALUES 
                        (@ClienteId, @Categoria, @Descripcion, @FotosJson, @RespuestasGuiadasJson, @UbicacionLat, @UbicacionLng, @UbicacionDireccion, DATEADD(MINUTE, 5, GETDATE()));
                    END";
                connection.Execute(updateSP);

                // 3.3 Create Cleanup SP
                var createCleanupSP = @"
                    CREATE OR ALTER PROCEDURE sp_LimpiarSolicitudesExpiradas
                    AS
                    BEGIN
                        SET NOCOUNT ON;

                        DELETE FROM tbl_SolicitudesServicio
                        WHERE FechaExpiracion < GETDATE()
                        AND Estado = 'Abierta';
                        
                        SELECT @@ROWCOUNT AS FilasEliminadas;
                    END";
                connection.Execute(createCleanupSP);
                
                connection.Execute(createCleanupSP);
                
                // 3.4 Update Quote SP to validate expiration
                var updateQuoteSP = @"
                    CREATE OR ALTER PROCEDURE sp_EnviarCotizacion
                        @SolicitudId UNIQUEIDENTIFIER,
                        @ProveedorId UNIQUEIDENTIFIER,
                        @Precio DECIMAL(10, 2),
                        @Mensaje NVARCHAR(MAX),
                        @TiempoEstimado NVARCHAR(50)
                    AS
                    BEGIN
                        SET NOCOUNT ON;

                        -- Validar que la solicitud no haya expirado
                        IF EXISTS (SELECT 1 FROM tbl_SolicitudesServicio WHERE Id = @SolicitudId AND FechaExpiracion < GETDATE())
                        BEGIN
                            THROW 51000, 'La solicitud ha expirado y no acepta más cotizaciones.', 1;
                        END

                        INSERT INTO tbl_CotizacionesServicio (SolicitudId, ProveedorId, Precio, Mensaje, TiempoEstimado)
                        OUTPUT INSERTED.Id
                        VALUES (@SolicitudId, @ProveedorId, @Precio, @Mensaje, @TiempoEstimado);

                        -- Verificar si ya existe chat, si no, crearlo
                        IF NOT EXISTS (SELECT 1 FROM tbl_Conversaciones WHERE RelacionId = @SolicitudId AND ProveedorId = @ProveedorId)
                        BEGIN
                            DECLARE @ClienteId UNIQUEIDENTIFIER;
                            SELECT @ClienteId = ClienteId FROM tbl_SolicitudesServicio WHERE Id = @SolicitudId;

                            INSERT INTO tbl_Conversaciones (TipoRelacion, RelacionId, ClienteId, ProveedorId)
                            VALUES ('Servicio', @SolicitudId, @ClienteId, @ProveedorId);
                        END
                    END";
                connection.Execute(updateQuoteSP);

                Console.WriteLine("Request Expiration Logic Updated.");
                
                // Fix existing conversations that don't have visibility flags set
                var fixVisibility = @"
                    UPDATE tbl_Conversaciones 
                    SET VisibleParaCliente = 1, VisibleParaProveedor = 1 
                    WHERE VisibleParaCliente = 0 OR VisibleParaProveedor = 0";
                connection.Execute(fixVisibility);
                Console.WriteLine("Existing conversations visibility fixed.");

                // 2.4 Service Requests Table
                var checkSql4 = @"
                    SELECT count(*) 
                    FROM sys.tables 
                    WHERE name = 'tbl_SolicitudesServicio'";
                
                int count4 = connection.QueryFirstOrDefault<int>(checkSql4);
                if (count4 == 0)
                {
                    Console.WriteLine("Creating tbl_SolicitudesServicio...");
                    var createTableSql = @"
                        CREATE TABLE tbl_SolicitudesServicio (
                            Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                            ClienteId UNIQUEIDENTIFIER NOT NULL,
                            ProveedorId UNIQUEIDENTIFIER NULL, -- Nullable for broadcast requests
                            ServicioId UNIQUEIDENTIFIER NULL, -- Nullable for general requests
                            Categoria NVARCHAR(50) NOT NULL,
                            Descripcion NVARCHAR(MAX) NOT NULL,
                            FotosJson NVARCHAR(MAX) NULL,
                            RespuestasGuiadasJson NVARCHAR(MAX) NULL,
                            UbicacionLat FLOAT,
                            UbicacionLng FLOAT,
                            UbicacionDireccion NVARCHAR(255),
                            Estado NVARCHAR(20) DEFAULT 'Pendiente', -- Pendiente, Aceptada, Rechazada, Cancelada
                            FechaSolicitud DATETIME DEFAULT GETDATE(),
                            FechaExpiracion DATETIME NULL
                        );";
                    connection.Execute(createTableSql);
                    Console.WriteLine("tbl_SolicitudesServicio Created.");
                }
                else
                {
                    // 2.4.1 Fix missing columns in existing table (Robust Logic)
                    try 
                    {
                        var checkColsOps = @"
                            SELECT count(*) 
                            FROM sys.columns 
                            WHERE object_id = OBJECT_ID(N'[dbo].[tbl_SolicitudesServicio]') 
                            AND name = 'ProveedorId'";
                        
                        int provColCount = connection.QueryFirstOrDefault<int>(checkColsOps);
                        Console.WriteLine($"Checking ProveedorId column: Found {provColCount}");
                        
                        if (provColCount == 0)
                        {
                            Console.WriteLine("Adding ProveedorId to tbl_SolicitudesServicio...");
                            connection.Execute("ALTER TABLE tbl_SolicitudesServicio ADD ProveedorId UNIQUEIDENTIFIER NULL");
                            Console.WriteLine("ProveedorId added successfully.");
                        }

                        var checkColsServ = @"
                            SELECT count(*) 
                            FROM sys.columns 
                            WHERE object_id = OBJECT_ID(N'[dbo].[tbl_SolicitudesServicio]') 
                            AND name = 'ServicioId'";

                        int servColCount = connection.QueryFirstOrDefault<int>(checkColsServ);
                        Console.WriteLine($"Checking ServicioId column: Found {servColCount}");

                        if (servColCount == 0)
                        {
                            Console.WriteLine("Adding ServicioId to tbl_SolicitudesServicio...");
                            connection.Execute("ALTER TABLE tbl_SolicitudesServicio ADD ServicioId UNIQUEIDENTIFIER NULL");
                            Console.WriteLine("ServicioId added successfully.");
                        }

                        // Check for FechaSolicitud
                        var checkColsDate = @"
                            SELECT count(*) 
                            FROM sys.columns 
                            WHERE object_id = OBJECT_ID(N'[dbo].[tbl_SolicitudesServicio]') 
                            AND name = 'FechaSolicitud'";

                        if (connection.QueryFirstOrDefault<int>(checkColsDate) == 0)
                        {
                            Console.WriteLine("Adding FechaSolicitud to tbl_SolicitudesServicio...");
                            connection.Execute("ALTER TABLE tbl_SolicitudesServicio ADD FechaSolicitud DATETIME DEFAULT GETDATE()");
                            Console.WriteLine("FechaSolicitud added successfully.");
                        }

                        // Check for FechaExpiracion
                        var checkColsExp = @"
                            SELECT count(*) 
                            FROM sys.columns 
                            WHERE object_id = OBJECT_ID(N'[dbo].[tbl_SolicitudesServicio]') 
                            AND name = 'FechaExpiracion'";

                        if (connection.QueryFirstOrDefault<int>(checkColsExp) == 0)
                        {
                            connection.Execute("ALTER TABLE tbl_SolicitudesServicio ADD FechaExpiracion DATETIME NULL");
                            Console.WriteLine("FechaExpiracion added successfully.");
                        }

                        // Check for Titulo
                        var checkColsTitle = @"
                            SELECT count(*) 
                            FROM sys.columns 
                            WHERE object_id = OBJECT_ID(N'[dbo].[tbl_SolicitudesServicio]') 
                            AND name = 'Titulo'";

                        if (connection.QueryFirstOrDefault<int>(checkColsTitle) == 0)
                        {
                            Console.WriteLine("Adding Titulo to tbl_SolicitudesServicio...");
                            connection.Execute("ALTER TABLE tbl_SolicitudesServicio ADD Titulo NVARCHAR(100) NULL");
                            Console.WriteLine("Titulo added successfully.");
                        }

                        // Check for Prioridad
                        var checkColsPrio = @"
                            SELECT count(*) 
                            FROM sys.columns 
                            WHERE object_id = OBJECT_ID(N'[dbo].[tbl_SolicitudesServicio]') 
                            AND name = 'Prioridad'";

                        if (connection.QueryFirstOrDefault<int>(checkColsPrio) == 0)
                        {
                            Console.WriteLine("Adding Prioridad to tbl_SolicitudesServicio...");
                            connection.Execute("ALTER TABLE tbl_SolicitudesServicio ADD Prioridad NVARCHAR(20) DEFAULT 'Normal'");
                            Console.WriteLine("Prioridad added successfully.");
                        }
                    }
                    catch (Exception ex)
                    {
                         Console.WriteLine($"Error fixing table columns: {ex.Message}");
                    }
                }

                // SP: Create Service Request
                // 2.5 Ensure tbl_NegociacionesServicio schema (Fixing missing columns)
                var checkNegTable = @"
                    SELECT count(*) 
                    FROM sys.tables 
                    WHERE name = 'tbl_NegociacionesServicio'";

                if (connection.QueryFirstOrDefault<int>(checkNegTable) == 0)
                {
                    Console.WriteLine("Creating tbl_NegociacionesServicio...");
                    var createNegTable = @"
                        CREATE TABLE tbl_NegociacionesServicio (
                            Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                            SolicitudId UNIQUEIDENTIFIER NULL,
                            ProveedorId UNIQUEIDENTIFIER NOT NULL,
                            ClienteId UNIQUEIDENTIFIER NOT NULL,
                            ServicioId UNIQUEIDENTIFIER NULL,
                            Estado NVARCHAR(50) DEFAULT 'Pendiente',
                            PrecioOriginal DECIMAL(10, 2), -- Standardized name
                            OfertaActual DECIMAL(10, 2),   -- Standardized name
                            UltimaOferta DECIMAL(10, 2),
                            UltimoEmisorId UNIQUEIDENTIFIER,
                            ContadorContraofertas INT DEFAULT 0,
                            FechaCreacion DATETIME DEFAULT GETDATE(),
                            FechaActualizacion DATETIME DEFAULT GETDATE()
                        );";
                    connection.Execute(createNegTable);
                    Console.WriteLine("tbl_NegociacionesServicio Created.");
                }
                else
                {
                    // Check and Add SolicitudId
                    var sqlAddSolicitudId = @"
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tbl_NegociacionesServicio]') AND name = 'SolicitudId')
                        BEGIN
                            ALTER TABLE tbl_NegociacionesServicio ADD SolicitudId UNIQUEIDENTIFIER NULL;
                        END";
                    connection.Execute(sqlAddSolicitudId);

                    // Check and Add Monetary Columns individually using T-SQL checks
                    var sqlAddPrecioOriginal = @"
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tbl_NegociacionesServicio]') AND name = 'PrecioOriginal')
                        BEGIN
                            ALTER TABLE tbl_NegociacionesServicio ADD PrecioOriginal DECIMAL(10, 2) DEFAULT 0;
                        END";
                    connection.Execute(sqlAddPrecioOriginal);
                    
                    var sqlAddOfertaActual = @"
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tbl_NegociacionesServicio]') AND name = 'OfertaActual')
                        BEGIN
                             ALTER TABLE tbl_NegociacionesServicio ADD OfertaActual DECIMAL(10, 2) DEFAULT 0;
                        END";
                    connection.Execute(sqlAddOfertaActual);

                    var sqlAddUltimaOferta = @"
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tbl_NegociacionesServicio]') AND name = 'UltimaOferta')
                        BEGIN
                             ALTER TABLE tbl_NegociacionesServicio ADD UltimaOferta DECIMAL(10, 2) DEFAULT 0;
                        END";
                    connection.Execute(sqlAddUltimaOferta);

                    var sqlAddContador = @"
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tbl_NegociacionesServicio]') AND name = 'ContadorContraofertas')
                        BEGIN
                            ALTER TABLE tbl_NegociacionesServicio ADD ContadorContraofertas INT DEFAULT 0;
                        END";
                    connection.Execute(sqlAddContador);

                }

                // FORCE Ensure ServicioId is NULLABLE (Critical for Broadcast Requests)
                // Moved outside conditional to ensure it runs
                var sqlMakeServicioNullable = @"
                    ALTER TABLE tbl_NegociacionesServicio ALTER COLUMN ServicioId UNIQUEIDENTIFIER NULL;
                ";
                try {
                    connection.Execute(sqlMakeServicioNullable);
                    Console.WriteLine("tbl_NegociacionesServicio.ServicioId set to NULL (Forced).");
                } catch(Exception ex) {
                        Console.WriteLine("Warning ensuring ServicioId nullable: " + ex.Message);
                }

                var spCreateRequest = @"
                CREATE OR ALTER PROCEDURE sp_CrearSolicitudServicio
                    @ClienteId UNIQUEIDENTIFIER,
                    @ProveedorId UNIQUEIDENTIFIER = NULL,
                    @ServicioId UNIQUEIDENTIFIER = NULL,
                    @Categoria NVARCHAR(50),
                    @Descripcion NVARCHAR(MAX),
                    @Titulo NVARCHAR(100) = NULL,
                    @Prioridad NVARCHAR(20) = 'Normal',
                    @FotosJson NVARCHAR(MAX) = NULL,
                    @RespuestasGuiadasJson NVARCHAR(MAX) = NULL,
                    @UbicacionLat FLOAT = 0,
                    @UbicacionLng FLOAT = 0,
                    @UbicacionDireccion NVARCHAR(255) = NULL,
                    @NewId UNIQUEIDENTIFIER OUTPUT
                AS
                BEGIN
                    SET NOCOUNT ON;
                    SET @NewId = NEWID();

                    INSERT INTO tbl_SolicitudesServicio (
                        Id, ClienteId, ProveedorId, ServicioId, Categoria, Descripcion, Titulo, Prioridad,
                        FotosJson, RespuestasGuiadasJson, UbicacionLat, UbicacionLng, UbicacionDireccion, FechaExpiracion
                    )
                    VALUES (
                        @NewId, @ClienteId, @ProveedorId, @ServicioId, @Categoria, @Descripcion, @Titulo, @Prioridad,
                        @FotosJson, @RespuestasGuiadasJson, @UbicacionLat, @UbicacionLng, @UbicacionDireccion,
                        DATEADD(MINUTE, 5, GETDATE()) -- Expiration 5 mins
                    );
                END";
                connection.Execute(spCreateRequest);
                Console.WriteLine("sp_CrearSolicitudServicio Refreshed.");

                // SP: Get Provider Requests
                var spGetProviderRequests = @"
                CREATE OR ALTER PROCEDURE sp_ObtenerSolicitudesProveedor
                    @ProveedorId UNIQUEIDENTIFIER
                AS
                BEGIN
                    SET NOCOUNT ON;
                    SELECT 
                        s.*,
                        u.Nombre as ClienteNombre,
                        CASE 
                            WHEN s.ServicioId IS NOT NULL THEN (SELECT Titulo FROM tbl_ServiciosOfrecidos WHERE Id = s.ServicioId)
                            ELSE NULL 
                        END as ServicioTitulo
                    FROM tbl_SolicitudesServicio s
                    JOIN tbl_Usuarios u ON s.ClienteId = u.Id
                    WHERE (s.ProveedorId = @ProveedorId OR s.ProveedorId IS NULL)
                    ORDER BY s.FechaSolicitud DESC;
                END";
                connection.Execute(spGetProviderRequests);
                Console.WriteLine("sp_ObtenerSolicitudesProveedor Refreshed.");

                // SP: Send Quote (and create chat/negotiation)
                var spSendQuote = @"
                CREATE OR ALTER PROCEDURE sp_EnviarCotizacion
                    @SolicitudId UNIQUEIDENTIFIER,
                    @ProveedorId UNIQUEIDENTIFIER,
                    @Precio DECIMAL(10, 2),
                    @Mensaje NVARCHAR(MAX) = NULL,
                    @TiempoEstimado NVARCHAR(50) = NULL,
                    @EsNegociable BIT = 0
                AS
                BEGIN
                    SET NOCOUNT ON;
                    DECLARE @ClienteId UNIQUEIDENTIFIER;
                    DECLARE @ConversacionId UNIQUEIDENTIFIER;
                    DECLARE @NegociacionId UNIQUEIDENTIFIER;
                    DECLARE @ServicioId UNIQUEIDENTIFIER;
                    
                    -- 1. Get Client and Service Info
                    SELECT @ClienteId = ClienteId, @ServicioId = ServicioId
                    FROM tbl_SolicitudesServicio WHERE Id = @SolicitudId;

                    IF @ClienteId IS NULL
                    BEGIN
                        SELECT 'ERROR' as Status, 'Solicitud no encontrada' as Message;
                        RETURN;
                    END

                    -- 2. Create Conversation
                    -- We use the SolicitudId as the RelacionId to maintain link to the specific request
                    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Servicio', @SolicitudId, @ConversacionId = @ConversacionId OUTPUT, @SuppressSelect = 1;

                    -- 3. Create or Update Negotiation Record
                    -- Check if negotiation already exists for this request/provider
                    SELECT @NegociacionId = Id FROM tbl_NegociacionesServicio 
                    WHERE SolicitudId = @SolicitudId AND ProveedorId = @ProveedorId;

                    IF @NegociacionId IS NULL
                    BEGIN
                        SET @NegociacionId = NEWID();
                        INSERT INTO tbl_NegociacionesServicio (
                            Id, SolicitudId, ServicioId, ProveedorId, ClienteId, Estado, 
                            PrecioOriginal, OfertaActual, UltimaOferta, UltimoEmisorId, 
                            ContadorContraofertas, FechaCreacion, FechaActualizacion
                        ) VALUES (
                            @NegociacionId, @SolicitudId, @ServicioId, @ProveedorId, @ClienteId, 'Pendiente',
                            @Precio, @Precio, @Precio, @ProveedorId,
                            0, GETDATE(), GETDATE()
                        );
                    END
                    ELSE
                    BEGIN
                        UPDATE tbl_NegociacionesServicio
                        SET OfertaActual = @Precio,
                            UltimaOferta = @Precio,
                            UltimoEmisorId = @ProveedorId,
                            Estado = 'Pendiente',
                            FechaActualizacion = GETDATE()
                        WHERE Id = @NegociacionId;
                    END

                    -- 4. Send Message
                    DECLARE @MsgContent NVARCHAR(MAX) = 'Ha enviado una cotización de $' + CAST(@Precio AS NVARCHAR(20));
                    IF @TiempoEstimado IS NOT NULL AND LEN(@TiempoEstimado) > 0 SET @MsgContent = @MsgContent + ' (' + @TiempoEstimado + ')';
                    IF @EsNegociable = 1 SET @MsgContent = @MsgContent + '. (Negociable)';
                    IF @Mensaje IS NOT NULL AND LEN(@Mensaje) > 0 SET @MsgContent = @MsgContent + CHAR(13) + CHAR(10) + @Mensaje;

                    INSERT INTO tbl_MensajesChat (Id, ConversacionId, EmisorId, Contenido, Tipo, FechaEnvio, Leido)
                    VALUES (NEWID(), @ConversacionId, @ProveedorId, @MsgContent, 'Cotizacion', GETDATE(), 0);

                    -- Return success
                    SELECT 'OK' AS Status, @NegociacionId AS Id;
                END";
                connection.Execute(spSendQuote);
                Console.WriteLine("sp_EnviarCotizacion Refreshed.");
                // 3. Ensure SPs are correct (Nuclear Option: Fix ALL Negotiation SPs)
                
                // 3.1 sp_GetOrCreateConversation
                var spGetOrCreate = @"
CREATE OR ALTER PROCEDURE sp_GetOrCreateConversation
    @ClienteId UNIQUEIDENTIFIER,
    @ProveedorId UNIQUEIDENTIFIER,
    @TipoRelacion NVARCHAR(20),
    @RelacionId UNIQUEIDENTIFIER,
    @ConversacionId UNIQUEIDENTIFIER = NULL OUTPUT,
    @SuppressSelect BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @ConversacionId = Id FROM tbl_Conversaciones
    WHERE ClienteId = @ClienteId AND ProveedorId = @ProveedorId 
      AND TipoRelacion = @TipoRelacion AND RelacionId = @RelacionId;

    IF @ConversacionId IS NULL
    BEGIN
        SET @ConversacionId = NEWID();
        INSERT INTO tbl_Conversaciones (Id, ClienteId, ProveedorId, TipoRelacion, RelacionId, VisibleParaCliente, VisibleParaProveedor)
        VALUES (@ConversacionId, @ClienteId, @ProveedorId, @TipoRelacion, @RelacionId, 1, 1);
    END

    -- Return for legacy/Dapper compatibility
    IF @SuppressSelect = 0
    BEGIN
        SELECT @ConversacionId;
    END
END";
                // 3. Ensure SPs are correct (Nuclear Option: Fix ALL Negotiation SPs)
                
                // Execute sp_GetOrCreateConversation
                connection.Execute(spGetOrCreate);
                Console.WriteLine("sp_GetOrCreateConversation Refreshed.");
                
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
             WHEN c.TipoRelacion = 'Servicio' THEN (SELECT TOP 1 OfertaActual FROM tbl_NegociacionesServicio WHERE (SolicitudId = c.RelacionId OR ServicioId = c.RelacionId) AND ClienteId = c.ClienteId AND ProveedorId = c.ProveedorId ORDER BY FechaActualizacion DESC)
             WHEN c.TipoRelacion = 'Producto' THEN (SELECT TOP 1 OfertaActual FROM tbl_NegociacionesProducto WHERE ProductoId = c.RelacionId AND ClienteId = c.ClienteId AND ProveedorId = c.ProveedorId ORDER BY FechaActualizacion DESC)
             ELSE 0
        END as QuotedPrice,
        -- Negotiation ID
        CASE 
             WHEN c.TipoRelacion = 'Servicio' THEN (SELECT TOP 1 Id FROM tbl_NegociacionesServicio WHERE (SolicitudId = c.RelacionId OR ServicioId = c.RelacionId) AND ClienteId = c.ClienteId AND ProveedorId = c.ProveedorId ORDER BY FechaActualizacion DESC)
             WHEN c.TipoRelacion = 'Producto' THEN (SELECT TOP 1 Id FROM tbl_NegociacionesProducto WHERE ProductoId = c.RelacionId AND ClienteId = c.ClienteId AND ProveedorId = c.ProveedorId ORDER BY FechaActualizacion DESC)
             ELSE NULL
        END as NegotiationId,
        CASE 
             WHEN c.TipoRelacion = 'Servicio' THEN (SELECT TOP 1 Estado FROM tbl_NegociacionesServicio WHERE (SolicitudId = c.RelacionId OR ServicioId = c.RelacionId) AND ClienteId = c.ClienteId AND ProveedorId = c.ProveedorId ORDER BY FechaActualizacion DESC)
             WHEN c.TipoRelacion = 'Producto' THEN (SELECT TOP 1 Estado FROM tbl_NegociacionesProducto WHERE ProductoId = c.RelacionId AND ClienteId = c.ClienteId AND ProveedorId = c.ProveedorId ORDER BY FechaActualizacion DESC)
             ELSE 'active'
        END as Status,
        -- Negotiation Counter
        CASE 
             WHEN c.TipoRelacion = 'Servicio' THEN (SELECT TOP 1 ContadorContraofertas FROM tbl_NegociacionesServicio WHERE (SolicitudId = c.RelacionId OR ServicioId = c.RelacionId) AND ClienteId = c.ClienteId AND ProveedorId = c.ProveedorId ORDER BY FechaActualizacion DESC)
             WHEN c.TipoRelacion = 'Producto' THEN (SELECT TOP 1 ContadorContraofertas FROM tbl_NegociacionesProducto WHERE ProductoId = c.RelacionId AND ClienteId = c.ClienteId AND ProveedorId = c.ProveedorId ORDER BY FechaActualizacion DESC)
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
    DECLARE @ConversacionId UNIQUEIDENTIFIER;

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
    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Servicio', @ServicioId, @ConversacionId = @ConversacionId OUTPUT;

    -- Insert Initial Message
    DECLARE @MsgContent NVARCHAR(MAX) = 'Ha iniciado una negociación con una oferta de $' + CAST(@OfertaMonto AS NVARCHAR(20));
    IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Message: ' + @Mensaje;

    INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
    VALUES (@ConversacionId, @ClienteId, @MsgContent, 'Negociacion');

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
    DECLARE @ConversacionId UNIQUEIDENTIFIER;

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
    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Producto', @ProductoId, @ConversacionId = @ConversacionId OUTPUT;

    -- Insert Initial Message
    DECLARE @MsgContent NVARCHAR(MAX) = 'Ha iniciado una negociación con una oferta de $' + CAST(@OfertaMonto AS NVARCHAR(20));
    IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Message: ' + @Mensaje;

    INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
    VALUES (@ConversacionId, @ClienteId, @MsgContent, 'Negociacion');

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
    DECLARE @SolicitudId UNIQUEIDENTIFIER;
    DECLARE @ConversacionId UNIQUEIDENTIFIER;

    SELECT @CurrentState = Estado, @CounterCount = ContadorContraofertas, @ProveedorId = ProveedorId, @SolicitudId = SolicitudId
    FROM tbl_NegociacionesServicio
    WHERE Id = @NegociacionId AND ClienteId = @ClienteId;

    IF @CurrentState IS NULL
    BEGIN
        SELECT 'ERROR' as Status, 'Negociación no encontrada' as Message;
        RETURN;
    END

    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Servicio', @SolicitudId, @ConversacionId = @ConversacionId OUTPUT;

    IF @Accion = 'Aceptar'
    BEGIN
        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Aceptada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;
        
        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversacionId, @ClienteId, 'Ha aceptado la oferta.', 'Sistema');
        
        SELECT 'OK' as Status, 'Oferta aceptada' as Message;
    END
    ELSE IF @Accion = 'Rechazar'
    BEGIN
        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Rechazada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;
 
        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversacionId, @ClienteId, 'Ha rechazado la oferta.', 'Sistema');
 
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
        VALUES (@ConversacionId, @ClienteId, @MsgContent, 'Negociacion');
 
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
    DECLARE @ConversacionId UNIQUEIDENTIFIER;

    SELECT @CurrentState = Estado, @CounterCount = ContadorContraofertas, @ProveedorId = ProveedorId, @ProductoId = ProductoId
    FROM tbl_NegociacionesProducto
    WHERE Id = @NegociacionId AND ClienteId = @ClienteId;

    IF @CurrentState IS NULL
    BEGIN
         SELECT 'ERROR' as Status, 'Negociación no encontrada' as Message;
         RETURN;
    END

    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Producto', @ProductoId, @ConversacionId = @ConversacionId OUTPUT;

    IF @Accion = 'Aceptar'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Aceptada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversacionId, @ClienteId, 'Ha aceptado la oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta aceptada' as Message;
    END
    ELSE IF @Accion = 'Rechazar'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Rechazada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversacionId, @ClienteId, 'Ha rechazado la oferta.', 'Sistema');

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
        VALUES (@ConversacionId, @ClienteId, @MsgContent, 'Negociacion');

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
            N.ContadorContraofertas,
            1 as EsNegociable -- For services, it's generally negotiable if it reached this stage, but we can refine this later if needed
        FROM tbl_NegociacionesServicio N
        LEFT JOIN tbl_SolicitudesServicio S ON N.SolicitudId = S.Id
        WHERE (N.Id = @RelacionId OR N.SolicitudId = @RelacionId OR N.ServicioId = @RelacionId)
          AND N.ClienteId = (SELECT ClienteId FROM tbl_Conversaciones WHERE Id = @ConversacionId)
          AND N.ProveedorId = (SELECT ProveedorId FROM tbl_Conversaciones WHERE Id = @ConversacionId)
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
            N.ContadorContraofertas,
            CAST(P.PermitirNegociacion AS BIT) AS EsNegociable
        FROM tbl_NegociacionesProducto N
        JOIN tbl_Productos P ON N.ProductoId = P.Id
        WHERE N.ProductoId = @RelacionId 
          AND N.ClienteId = (SELECT ClienteId FROM tbl_Conversaciones WHERE Id = @ConversacionId)
          AND N.ProveedorId = (SELECT ProveedorId FROM tbl_Conversaciones WHERE Id = @ConversacionId)
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
    DECLARE @RelacionId UNIQUEIDENTIFIER;
    DECLARE @ConversacionId UNIQUEIDENTIFIER;

    SELECT @CurrentState = Estado, @CounterCount = ContadorContraofertas, @ProveedorId = ProveedorId, 
           @RelacionId = COALESCE(SolicitudId, ServicioId)
    FROM tbl_NegociacionesServicio
    WHERE Id = @NegociacionId AND ClienteId = @ClienteId;

    IF @CurrentState IS NULL
    BEGIN
        SELECT 'ERROR' as Status, 'Negociación no encontrada' as Message;
        RETURN;
    END

    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Servicio', @RelacionId, @ConversacionId = @ConversacionId OUTPUT;

    IF @Accion = 'Aceptar'
    BEGIN
        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Aceptada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;
        
        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversacionId, @ClienteId, 'Ha aceptado la oferta.', 'Sistema');
        
        SELECT 'OK' as Status, 'Oferta aceptada' as Message;
    END
    ELSE IF @Accion = 'Rechazar'
    BEGIN
        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Rechazada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversacionId, @ClienteId, 'Ha rechazado la oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta rechazada' as Message;
    END
    ELSE IF @Accion = 'Contraoferta'
    BEGIN
        IF @CounterCount >= 10
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
        VALUES (@ConversacionId, @ClienteId, @MsgContent, 'Negociacion');

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
    DECLARE @ConversacionId UNIQUEIDENTIFIER;

    SELECT @CurrentState = Estado, @CounterCount = ContadorContraofertas, @ProveedorId = ProveedorId, @ProductoId = ProductoId
    FROM tbl_NegociacionesProducto
    WHERE Id = @NegociacionId AND ClienteId = @ClienteId;

    IF @CurrentState IS NULL
    BEGIN
         SELECT 'ERROR' as Status, 'Negociación no encontrada' as Message;
         RETURN;
    END

    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Producto', @ProductoId, @ConversacionId = @ConversacionId OUTPUT;

    IF @Accion = 'Aceptar'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Aceptada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversacionId, @ClienteId, 'Ha aceptado la oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta aceptada' as Message;
    END
    ELSE IF @Accion = 'Rechazar'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Rechazada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversacionId, @ClienteId, 'Ha rechazado la oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta rechazada' as Message;
    END
    ELSE IF @Accion = 'Contraoferta'
    BEGIN
        IF @CounterCount >= 10
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
        VALUES (@ConversacionId, @ClienteId, @MsgContent, 'Negociacion');

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
    DECLARE @RelacionId UNIQUEIDENTIFIER;
    DECLARE @ConversacionId UNIQUEIDENTIFIER;

    SELECT @CurrentState = Estado, @CounterCount = ContadorContraofertas, @ClientId = ClienteId, 
           @RelacionId = COALESCE(SolicitudId, ServicioId)
    FROM tbl_NegociacionesServicio
    WHERE Id = @NegociacionId AND ProveedorId = @ProveedorId;

    IF @CurrentState IS NULL
    BEGIN
        SELECT 'ERROR' as Status, 'Negociación no encontrada' as Message;
        RETURN;
    END

    -- Ensure Conversation Exists
    EXEC sp_GetOrCreateConversation @ClientId, @ProveedorId, 'Servicio', @RelacionId, @ConversacionId = @ConversacionId OUTPUT;

    -- Logic
    IF @Accion = 'Aceptar'
    BEGIN
        UPDATE tbl_NegociacionesServicio
        SET Estado = 'Aceptada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;
        
        -- Insert Chat Message
        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversacionId, @ProveedorId, 'Ha aceptado tu oferta.', 'Sistema');
        
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
        VALUES (@ConversacionId, @ProveedorId, 'Ha rechazado tu oferta.', 'Sistema');

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
        VALUES (@ConversacionId, @ProveedorId, @MsgContent, 'Negociacion');

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
    DECLARE @ConversacionId UNIQUEIDENTIFIER;

    SELECT @CurrentState = Estado, @CounterCount = ContadorContraofertas, @ClientId = ClienteId, @ProductoId = ProductoId
    FROM tbl_NegociacionesProducto
    WHERE Id = @NegociacionId AND ProveedorId = @ProveedorId;

    IF @CurrentState IS NULL
    BEGIN
         SELECT 'ERROR' as Status, 'Negociación no encontrada' as Message;
         RETURN;
    END

    -- Ensure Conversation Exists (FIXED OUTPUT PARAM)
    EXEC sp_GetOrCreateConversation @ClientId, @ProveedorId, 'Producto', @ProductoId, @ConversacionId = @ConversacionId OUTPUT;

    IF @Accion = 'Aceptar'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Aceptada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversacionId, @ProveedorId, 'Ha aceptado tu oferta.', 'Sistema');

        SELECT 'OK' as Status, 'Oferta aceptada' as Message;
    END
    ELSE IF @Accion = 'Rechazar'
    BEGIN
        UPDATE tbl_NegociacionesProducto
        SET Estado = 'Rechazada',
            FechaActualizacion = GETDATE()
        WHERE Id = @NegociacionId;

        INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
        VALUES (@ConversacionId, @ProveedorId, 'Ha rechazado tu oferta.', 'Sistema');

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
        VALUES (@ConversacionId, @ProveedorId, 'Ha enviado una contraoferta', 'Negociacion');

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
        COALESCE(S.Id, N.SolicitudId) as ItemId,
        COALESCE(S.Titulo, (SELECT Titulo FROM tbl_SolicitudesServicio WHERE Id = N.SolicitudId)) as ItemTitulo,
        U.Nombre as ClienteNombre,
        N.PrecioOriginal,
        N.OfertaActual,
        N.UltimoEmisorId,
        N.Estado,
        N.ContadorContraofertas,
        N.FechaActualizacion
    FROM tbl_NegociacionesServicio N
    LEFT JOIN tbl_ServiciosOfrecidos S ON N.ServicioId = S.Id
    JOIN tbl_Usuarios U ON N.ClienteId = U.Id
    WHERE (S.ProveedorId = @ProveedorId OR N.ProveedorId = @ProveedorId)

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

                // 2.7 Escrow Payments Tables
                Console.WriteLine("Ensuring Escrow Payments Schema...");
                var sqlPaymentsSchema = @"
                    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_Pagos' AND xtype='U')
                    CREATE TABLE tbl_Pagos (
                        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        ClienteId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
                        ProveedorId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
                        Monto DECIMAL(10, 2) NOT NULL,
                        ItemName NVARCHAR(200) NOT NULL,
                        ItemType NVARCHAR(20) NOT NULL,
                        Status NVARCHAR(20) NOT NULL DEFAULT 'Retenido',
                        FechaCreacion DATETIME DEFAULT GETDATE(),
                        FechaActualizacion DATETIME DEFAULT GETDATE()
                    );

                    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_PagosLogs' AND xtype='U')
                    CREATE TABLE tbl_PagosLogs (
                        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        PagoId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Pagos(Id),
                        Accion NVARCHAR(100) NOT NULL,
                        Mensaje NVARCHAR(MAX),
                        FechaCreacion DATETIME DEFAULT GETDATE()
                    );";
                connection.Execute(sqlPaymentsSchema);

                // 2.8 Escrow Payments SPs
                Console.WriteLine("Registering Escrow SPs...");
                
                connection.Execute(@"
                    CREATE OR ALTER PROCEDURE sp_RegistrarPago
                        @ClienteId UNIQUEIDENTIFIER,
                        @ProveedorId UNIQUEIDENTIFIER,
                        @Monto DECIMAL(10, 2),
                        @ItemName NVARCHAR(200),
                        @ItemType NVARCHAR(20)
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        DECLARE @PagoId UNIQUEIDENTIFIER = NEWID();
                        INSERT INTO tbl_Pagos (Id, ClienteId, ProveedorId, Monto, ItemName, ItemType, Status)
                        VALUES (@PagoId, @ClienteId, @ProveedorId, @Monto, @ItemName, @ItemType, 'Retenido');
                        INSERT INTO tbl_PagosLogs (PagoId, Accion, Mensaje)
                        VALUES (@PagoId, 'Pago Realizado', 'Fondos retenidos en garantía');
                        SELECT * FROM tbl_Pagos WHERE Id = @PagoId;
                    END;");

                connection.Execute(@"
                    CREATE OR ALTER PROCEDURE sp_ObtenerHistorialPagosCliente
                        @ClienteId UNIQUEIDENTIFIER
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        SELECT p.*, u.Nombre as ProviderName
                        FROM tbl_Pagos p
                        INNER JOIN tbl_Usuarios u ON p.ProveedorId = u.Id
                        WHERE p.ClienteId = @ClienteId
                        ORDER BY p.FechaCreacion DESC;
                    END;");

                connection.Execute(@"
                    CREATE OR ALTER PROCEDURE sp_ObtenerHistorialVentasProveedor
                        @ProveedorId UNIQUEIDENTIFIER
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        SELECT p.*, u.Nombre as ClientName
                        FROM tbl_Pagos p
                        INNER JOIN tbl_Usuarios u ON p.ClienteId = u.Id
                        WHERE p.ProveedorId = @ProveedorId
                        ORDER BY p.FechaCreacion DESC;
                    END;");

                connection.Execute(@"
                    CREATE OR ALTER PROCEDURE sp_ActualizarEstadoPago
                        @PagoId UNIQUEIDENTIFIER,
                        @NuevoEstado NVARCHAR(20),
                        @Accion NVARCHAR(100),
                        @Mensaje NVARCHAR(MAX) = NULL
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        UPDATE tbl_Pagos SET Status = @NuevoEstado, FechaActualizacion = GETDATE() WHERE Id = @PagoId;
                        INSERT INTO tbl_PagosLogs (PagoId, Accion, Mensaje)
                        VALUES (@PagoId, @Accion, @Mensaje);
                        SELECT * FROM tbl_Pagos WHERE Id = @PagoId;
                    END;");

                connection.Execute(@"
                    CREATE OR ALTER PROCEDURE sp_ObtenerLogsPago
                        @PagoId UNIQUEIDENTIFIER
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        SELECT * FROM tbl_PagosLogs WHERE PagoId = @PagoId ORDER BY FechaCreacion ASC;
                    END;");

                Console.WriteLine("Escrow Payments Schema Ensured.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Schema Update Error: {ex.Message}");
            }
        }
    }
}
