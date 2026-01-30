USE CotizappBD;
GO

-- 5. SP: Get User Conversations (Client or Provider) - UPDATED
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
        u.Nombre as InterviewerName, -- Name of the OTHER person
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
             WHEN c.TipoRelacion = 'Servicio' THEN (SELECT OfertaActual FROM tbl_NegociacionesServicio WHERE ServicioId = c.RelacionId AND ClienteId = c.ClienteId)
             WHEN c.TipoRelacion = 'Producto' THEN (SELECT OfertaActual FROM tbl_NegociacionesProducto WHERE ProductoId = c.RelacionId AND ClienteId = c.ClienteId)
             ELSE 0
        END as QuotedPrice,
        -- Negotiation ID
        CASE 
             WHEN c.TipoRelacion = 'Servicio' THEN (SELECT Id FROM tbl_NegociacionesServicio WHERE ServicioId = c.RelacionId AND ClienteId = c.ClienteId)
             WHEN c.TipoRelacion = 'Producto' THEN (SELECT Id FROM tbl_NegociacionesProducto WHERE ProductoId = c.RelacionId AND ClienteId = c.ClienteId)
             ELSE NULL
        END as NegotiationId,
        'active' as Status
    FROM tbl_Conversaciones c
    JOIN tbl_Usuarios u ON (c.ClienteId = u.Id OR c.ProveedorId = u.Id)
    WHERE (c.ClienteId = @UsuarioId OR c.ProveedorId = @UsuarioId)
      AND u.Id != @UsuarioId 
    ORDER BY LastMessageTime DESC;
END
GO
