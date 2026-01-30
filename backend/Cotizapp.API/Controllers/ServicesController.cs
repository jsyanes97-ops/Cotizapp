using Microsoft.AspNetCore.Mvc;
using Cotizapp.API.Services;
using Cotizapp.API.Models;

namespace Cotizapp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServicesController : ControllerBase
    {
        private readonly DbService _db;

        public ServicesController(DbService db)
        {
            _db = db;
        }

        [HttpGet("provider/{providerId}")]
        public async Task<IActionResult> GetByProvider(Guid providerId)
        {
            try
            {
                var services = await _db.GetAllAsync<ServiceListingDto>(
                    "sp_ObtenerServiciosProveedor", 
                    new { ProveedorId = providerId }
                );
                return Ok(services);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            try
            {
                var services = await _db.GetAllAsync<ServiceListingDto>(
                    "sp_ObtenerServiciosActivos", 
                    new { }
                );
                return Ok(services);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("manage")]
        public async Task<IActionResult> ManageService([FromBody] ServiceListingDto req)
        {
            try
            {
                // Action logic based on ID presence? No, explicit action needed or infer.
                // Assuming 'INSERT' if Id is null, 'UPDATE' if Id present in real app.
                // But DTO doesn't carry Action. Let's assume this is Create/Update wrapper
                // OR better, explicit params.
                
                // For simplicity, if ID is null => INSERT, else UPDATE.
                string action = req.Id == null ? "INSERT" : "UPDATE";

                var resultId = await _db.EditDataReturnObject<Guid>("sp_GestionarServicioOfrecido", new {
                    Accion = action,
                    Id = req.Id,
                    ProveedorId = req.ProveedorId,
                    Categoria = req.Categoria,
                    Titulo = req.Titulo,
                    Descripcion = req.Descripcion,
                    Precio = req.Precio,
                    PrecioTipo = req.PrecioTipo,
                    Etiquetas = req.Etiquetas,
                    CoberturaArea = req.CoberturaArea,
                    PermitirNegociacion = req.PermitirNegociacion,
                    PrecioMinimo = req.PrecioMinimo
                });

                return Ok(new { Id = resultId, Message = "Servicio guardado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("delete/{id}")]
        public async Task<IActionResult> DeleteService(Guid id, [FromQuery] Guid providerId)
        {
            try
            {
                await _db.EditDataReturnObject<Guid>("sp_GestionarServicioOfrecido", new {
                    Accion = "DELETE",
                    Id = id,
                    ProveedorId = providerId
                });
                return Ok(new { Message = "Servicio eliminado" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("toggle/{id}")]
        public async Task<IActionResult> ToggleService(Guid id, [FromQuery] Guid providerId)
        {
            try
            {
                await _db.EditDataReturnObject<Guid>("sp_GestionarServicioOfrecido", new {
                    Accion = "TOGGLE",
                    Id = id,
                    ProveedorId = providerId
                });
                return Ok(new { Message = "Estado cambiado" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("negotiate")]
        public async Task<IActionResult> NegotiateService([FromBody] NegotiateServiceRequest req)
        {
            try
            {
                // Use a concrete class for the result to avoid dynamic binding issues
                var rows = await _db.GetAllAsync<NegotiationResult>("sp_IniciarNegociacionServicio", new
                {
                    ServicioId = req.ServiceId,
                    ClienteId = req.ClientId,
                    OfertaMonto = req.OfferAmount,
                    Mensaje = req.Message
                });

                var row = rows.FirstOrDefault();
                if (row == null) return BadRequest(new { Error = "No hubo respuesta del servidor" });

                if (row.Status == "ERROR")
                {
                    return BadRequest(new { Error = row.Message });
                }

                return Ok(new { Id = row.Id, Message = "Oferta enviada exitosamente" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in NegotiateService: {ex.Message}");
                return BadRequest(new { Error = ex.Message });
            }
        }
        [HttpGet("fix-db-schema")]
        public async Task<IActionResult> RunSchemaFix()
        {
            try
            {
                // 1. Fix tbl_Conversaciones.RelacionId (BRUTE FORCE)
                var sql1 = @"
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tbl_Conversaciones]') AND name = 'RelacionId' AND system_type_id != 36)
BEGIN
    DECLARE @TableName NVARCHAR(MAX) = 'tbl_Conversaciones';
    DECLARE @ColName NVARCHAR(MAX) = 'RelacionId';
    DECLARE @Sql NVARCHAR(MAX) = '';

    -- 1. Drop Default Constraints
    SELECT @Sql += 'ALTER TABLE ' + @TableName + ' DROP CONSTRAINT ' + name + ';'
    FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID(@TableName)
    AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID(@TableName) AND name = @ColName);

    -- 2. Drop Indexes
    SELECT @Sql += 'DROP INDEX ' + name + ' ON ' + @TableName + ';'
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(@TableName)
    AND index_id IN (SELECT index_id FROM sys.index_columns WHERE object_id = OBJECT_ID(@TableName) AND column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID(@TableName) AND name = @ColName));

    -- execute drops
    IF @Sql != '' EXEC sp_executesql @Sql;

    -- 3. Drop Column
    ALTER TABLE tbl_Conversaciones DROP COLUMN RelacionId;
    
    -- 4. Re-add Column
    ALTER TABLE tbl_Conversaciones ADD RelacionId UNIQUEIDENTIFIER NULL;
END";
                await _db.EditData(sql1, new { });

                // 2. Fix tbl_NegociacionesServicio.UltimoEmisorId
                var sql2 = @"
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[tbl_NegociacionesServicio]') 
    AND name = 'UltimoEmisorId' 
    AND system_type_id != 36
)
BEGIN
    ALTER TABLE tbl_NegociacionesServicio ALTER COLUMN UltimoEmisorId UNIQUEIDENTIFIER;
END";
                await _db.EditData(sql2, new { });

                // Re-create SPs
                var sp1 = @"
CREATE OR ALTER PROCEDURE sp_GetOrCreateConversation
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
END
";
                await _db.EditData(sp1, new { });

                var sp2 = @"
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

    -- Create Chat Conversation
    EXEC sp_GetOrCreateConversation @ClienteId, @ProveedorId, 'Servicio', @ServicioId, @ConversationId = @ConversationId OUTPUT;

    -- Insert Initial Message
    DECLARE @MsgContent NVARCHAR(MAX) = 'Ha iniciado una negociación con una oferta de $' + CAST(@OfertaMonto AS NVARCHAR(20));
    IF @Mensaje IS NOT NULL SET @MsgContent = @MsgContent + '. Mensaje: ' + @Mensaje;

    INSERT INTO tbl_MensajesChat (ConversacionId, EmisorId, Contenido, Tipo)
    VALUES (@ConversationId, @ClienteId, @MsgContent, 'Negociacion');

    SELECT 'OK' as Status, CAST(@NewId AS NVARCHAR(50)) as Id;
END
";
                await _db.EditData(sp2, new { });

                return Ok(new { Message = "Schema Fixed Successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
        [HttpGet("check-db-schema")]
        public async Task<IActionResult> CheckSchema()
        {
            try
            {
                var sql = @"
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    CASE WHEN ix.name IS NOT NULL THEN 'Indexed' ELSE 'No Index' END AS IndexStatus,
    ix.name AS IndexName
FROM sys.columns c
INNER JOIN sys.types t ON c.system_type_id = t.system_type_id
LEFT JOIN sys.index_columns ic ON c.object_id = ic.object_id AND c.column_id = ic.column_id
LEFT JOIN sys.indexes ix ON ic.object_id = ix.object_id AND ic.index_id = ix.index_id
WHERE c.object_id = OBJECT_ID('tbl_Conversaciones') AND c.name = 'RelacionId'
AND t.name != 'sysname';
";
                var result = await _db.GetAllAsync<dynamic>(sql, new { });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(new { Error = ex.Message });
            }
        }
    }
    
    public class NegotiateServiceRequest
    {
        public Guid ServiceId { get; set; }
        public Guid ClientId { get; set; }
        public decimal OfferAmount { get; set; }
        public string Message { get; set; }
    }


}
