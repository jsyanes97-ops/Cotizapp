USE CotizappBD;
GO

-- =============================================
-- SP: Crear Solicitud de Servicio
-- =============================================
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
END
GO

-- =============================================
-- SP: Obtener Solicitudes Cercanas (Para Proveedor)
-- =============================================
-- Nota: En prod usar geolocalización real (Geography), aquí usamos aproximación simple por Lat/Lng
CREATE OR ALTER PROCEDURE sp_ObtenerSolicitudesCercanas
    @ProveedorId UNIQUEIDENTIFIER,
    @LatProveedor FLOAT,
    @LngProveedor FLOAT,
    @RadioKM INT,
    @Categoria NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    -- Aproximación: 1 grado lat ~= 111km. 
    -- Filtramos primero por bounding box rough para performance, luego lógica mas fina si fuera necesario
    DECLARE @GradosDelta FLOAT = @RadioKM / 111.0;

    SELECT s.*, u.Nombre as NombreCliente
    FROM tbl_SolicitudesServicio s
    INNER JOIN tbl_Usuarios u ON s.ClienteId = u.Id
    WHERE s.Categoria = @Categoria
    AND s.Estado = 'Abierta'
    AND s.FechaExpiracion > GETDATE()
    AND s.UbicacionLat BETWEEN (@LatProveedor - @GradosDelta) AND (@LatProveedor + @GradosDelta)
    AND s.UbicacionLng BETWEEN (@LngProveedor - @GradosDelta) AND (@LngProveedor + @GradosDelta)
    ORDER BY s.FechaCreacion DESC;
END
GO

-- =============================================
-- SP: Enviar Cotización
-- =============================================
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
END
GO

-- =============================================
-- SP: Enviar Mensaje Chat
-- =============================================
CREATE OR ALTER PROCEDURE sp_EnviarMensaje
    @ConversacionId UNIQUEIDENTIFIER,
    @EmisorId UNIQUEIDENTIFIER,
    @Contenido NVARCHAR(MAX),
    @Tipo NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
    VALUES (@ConversacionId, @EmisorId, @Contenido, @Tipo);

    UPDATE tbl_Conversaciones
    SET FechaUltimoMensaje = GETDATE()
    WHERE Id = @ConversacionId;
END
GO

-- =============================================
-- SP: Obtener Chat
-- =============================================
CREATE OR ALTER PROCEDURE sp_ObtenerMensajes
    @ConversacionId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * 
    FROM tbl_MensajesChat
    WHERE ConversacionId = @ConversacionId
    ORDER BY FechaEnvio ASC;
END
GO

-- =============================================
-- SP: Limpiar Solicitudes Expiradas
-- =============================================
CREATE OR ALTER PROCEDURE sp_LimpiarSolicitudesExpiradas
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM tbl_SolicitudesServicio
    WHERE FechaExpiracion < GETDATE()
    AND Estado = 'Abierta';
    
    SELECT @@ROWCOUNT AS FilasEliminadas;
END
GO
