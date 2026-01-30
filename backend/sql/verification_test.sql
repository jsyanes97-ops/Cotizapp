
-- Verification Script for Chat Negotiation Flow
DECLARE @ClientId UNIQUEIDENTIFIER = NEWID();
DECLARE @ProviderId UNIQUEIDENTIFIER = NEWID();
DECLARE @ServiceId UNIQUEIDENTIFIER = NEWID();
DECLARE @ConversacionId UNIQUEIDENTIFIER;
DECLARE @NegotiationId UNIQUEIDENTIFIER;

-- 1. Setup Mock Data
INSERT INTO tbl_Usuarios (Id, Nombre, Email, PasswordHash, TipoUsuario, FechaRegistro)
VALUES (@ClientId, 'Test Client', 'client@test.com', 'hash', 'Cliente', GETDATE());

INSERT INTO tbl_Usuarios (Id, Nombre, Email, PasswordHash, TipoUsuario, FechaRegistro)
VALUES (@ProviderId, 'Test Provider', 'provider@test.com', 'hash', 'Proveedor', GETDATE());

INSERT INTO tbl_ServiciosOfrecidos (Id, ProveedorId, Titulo, Descripcion, Precio, PrecioMinimo, Categoria, Ubicacion, PermitirNegociacion, FechaCreacion)
VALUES (@ServiceId, @ProviderId, 'Test Service', 'Desc', 100.00, 80.00, 'Plomeria', 'Panama', 1, GETDATE());

-- 2. Start Negotiation (Client initiates)
PRINT 'Starting Negotiation...';
DECLARE @OutputTable TABLE (Status NVARCHAR(50), Id NVARCHAR(50));

INSERT INTO @OutputTable
EXEC sp_IniciarNegociacionServicio @ServiceId, @ClientId, 90.00, 'I want a discount';

SELECT @NegotiationId = CAST(Id AS UNIQUEIDENTIFIER) FROM @OutputTable;
PRINT 'Negotiation ID: ' + CAST(@NegotiationId AS NVARCHAR(50));

-- 3. Verify Conversation Created
SELECT @ConversacionId = Id FROM tbl_Conversaciones WHERE RelacionId = @ServiceId AND ClienteId = @ClientId;
PRINT 'Conversation ID: ' + CAST(@ConversacionId AS NVARCHAR(50));

-- 4. Verify Initial Message
SELECT 'Initial Message' AS Step, * FROM tbl_MensajesChat WHERE ConversacionId = @ConversacionId;

-- 5. Perform Counter-Offer (Client updates)
-- Wait, usually Provider counters first, but let's say Client counters again (logic permits?)
-- Actually sp_GestionarNegociacionClienteServicio is for CLIENT actions.
-- If Client started it, state is 'Pendiente'. Provider needs to answer.
-- Only PROVIDER can 'Aceptar', 'Rechazar', 'Contraoferta' on a 'Pendiente' negotiation?
-- Let's check sp_IniciarNegociacionServicio ... sets state to 'Pendiente'.
-- sp_GestionarNegociacionClienteServicio verifies logic?

-- Let's emulate PROVIDER counter-offer first.
PRINT 'Provider Counter-Offer...';
EXEC sp_GestionarNegociacionServicio @NegotiationId, @ProviderId, 'Contraoferta', 95.00, 'Best I can do';

-- Verify Provider Message
SELECT 'Provider Message' AS Step, * FROM tbl_MensajesChat WHERE ConversacionId = @ConversacionId;

-- 6. Perform Client Counter-Offer
PRINT 'Client Counter-Offer...';
EXEC sp_GestionarNegociacionClienteServicio @NegotiationId, @ClientId, 'Contraoferta', 92.00, 'Meet halfway?';

-- Verify Client Message
SELECT 'Client Message' AS Step, * FROM tbl_MensajesChat WHERE ConversacionId = @ConversacionId;

-- Cleanup
DELETE FROM tbl_MensajesChat WHERE ConversacionId = @ConversacionId;
DELETE FROM tbl_Conversaciones WHERE Id = @ConversacionId;
DELETE FROM tbl_NegociacionesServicio WHERE Id = @NegotiationId;
DELETE FROM tbl_ServiciosOfrecidos WHERE Id = @ServiceId;
DELETE FROM tbl_Usuarios WHERE Id IN (@ClientId, @ProviderId);
