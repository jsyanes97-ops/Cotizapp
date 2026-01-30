USE CotizappBD;
GO

-- 1. Table: Negotiations for Services (Direct Offers)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_NegociacionesServicio' AND xtype='U')
CREATE TABLE tbl_NegociacionesServicio (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ServicioId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_ServiciosOfrecidos(Id),
    ClienteId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    ProveedorId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    PrecioOriginal DECIMAL(10, 2) NOT NULL,
    OfertaActual DECIMAL(10, 2) NOT NULL,
    UltimoEmisorId UNIQUEIDENTIFIER NOT NULL, -- Client or Provider ID
    Estado NVARCHAR(20) DEFAULT 'Pendiente', -- Pendiente, Aceptada, Rechazada, Contraoferta
    MensajeInicial NVARCHAR(MAX),
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FechaActualizacion DATETIME DEFAULT GETDATE()
);
GO

-- 2. SP: Start Negotiation (with Validation)
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

    -- Get Service Details
    SELECT 
        @ProveedorId = ProveedorId,
        @PrecioMinimo = PrecioMinimo,
        @PrecioOriginal = Precio,
        @PermitirNegociacion = PermitirNegociacion
    FROM tbl_ServiciosOfrecidos
    WHERE Id = @ServicioId;

    -- Validation 1: Does service exist?
    IF @ProveedorId IS NULL
    BEGIN
        SELECT 'ERROR' as Status, 'Servicio no encontrado' as Message;
        RETURN;
    END

    -- Validation 2: Is negotiation allowed?
    IF @PermitirNegociacion = 0
    BEGIN
        SELECT 'ERROR' as Status, 'Este servicio no permite negociación' as Message;
        RETURN;
    END

    -- Validation 3: Price Limit
    IF @PrecioMinimo IS NOT NULL AND @OfertaMonto < @PrecioMinimo
    BEGIN
        SELECT 'ERROR' as Status, 'La oferta es menor al precio mínimo aceptable por el proveedor' as Message;
        RETURN;
    END

    -- Validation 4: Duplicate Check (Prevent spam)
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

    SELECT 'OK' as Status, CAST(@NewId AS NVARCHAR(50)) as Id;
END
GO
