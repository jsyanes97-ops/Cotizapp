USE CotizappBD;
GO

-- =============================================
-- 1. Tablas de Pagos y Escrow
-- =============================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_Pagos' AND xtype='U')
CREATE TABLE tbl_Pagos (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClienteId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    ProveedorId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    Monto DECIMAL(10, 2) NOT NULL,
    ItemName NVARCHAR(200) NOT NULL,
    ItemType NVARCHAR(20) NOT NULL, -- 'Producto' o 'Servicio'
    Status NVARCHAR(20) NOT NULL DEFAULT 'Retenido', -- Retenido, Entregado, Liberado, En Disputa, Devuelto
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FechaActualizacion DATETIME DEFAULT GETDATE()
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_PagosLogs' AND xtype='U')
CREATE TABLE tbl_PagosLogs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PagoId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Pagos(Id),
    Accion NVARCHAR(100) NOT NULL,
    Mensaje NVARCHAR(MAX),
    FechaCreacion DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 2. Stored Procedures
-- =============================================

-- Registrar Pago Inicial
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
END
GO

-- Obtener Historial de Pagos (Cliente)
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
END
GO

-- Obtener Historial de Ventas (Proveedor)
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
END
GO

-- Actualizar Estado de Pago y Registrar Log
CREATE OR ALTER PROCEDURE sp_ActualizarEstadoPago
    @PagoId UNIQUEIDENTIFIER,
    @NuevoEstado NVARCHAR(20),
    @Accion NVARCHAR(100),
    @Mensaje NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE tbl_Pagos 
    SET Status = @NuevoEstado, FechaActualizacion = GETDATE()
    WHERE Id = @PagoId;

    INSERT INTO tbl_PagosLogs (PagoId, Accion, Mensaje)
    VALUES (@PagoId, @Accion, @Mensaje);

    SELECT * FROM tbl_Pagos WHERE Id = @PagoId;
END
GO

-- Obtener Logs de un Pago
CREATE OR ALTER PROCEDURE sp_ObtenerLogsPago
    @PagoId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM tbl_PagosLogs 
    WHERE PagoId = @PagoId 
    ORDER BY FechaCreacion ASC;
END
GO
