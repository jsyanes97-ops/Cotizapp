USE CotizappBD;
GO

-- =============================================
-- 1. Table: Payments History
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_Pagos' AND xtype='U')
CREATE TABLE tbl_Pagos (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UsuarioId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    Monto DECIMAL(10, 2) NOT NULL,
    MetodoPago NVARCHAR(50) NOT NULL, -- 'Tarjeta', 'Yappy', etc.
    Estado NVARCHAR(20) NOT NULL DEFAULT 'Completado',
    FechaPago DATETIME DEFAULT GETDATE(),
    ReferenciaExterna NVARCHAR(100) -- Stripe ID, etc.
);
GO

-- =============================================
-- 2. SP: Register Payment & Upgrade Membership
-- =============================================
CREATE OR ALTER PROCEDURE sp_RegistrarPagoMembresia
    @UsuarioId UNIQUEIDENTIFIER,
    @Monto DECIMAL(10, 2),
    @MetodoPago NVARCHAR(50),
    @ReferenciaExterna NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Record Payment
        INSERT INTO tbl_Pagos (UsuarioId, Monto, MetodoPago, Estado, ReferenciaExterna)
        VALUES (@UsuarioId, @Monto, @MetodoPago, 'Completado', @ReferenciaExterna);

        -- 2. Update Provider Profile to Premium
        UPDATE tbl_ProveedoresPerfil
        SET EsPremium = 1,
            FechaActualizacion = GETDATE()
        WHERE UsuarioId = @UsuarioId;

        COMMIT TRANSACTION;
        
        SELECT 1 as Result; -- Success
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        -- Return Error Info
        SELECT 
            ERROR_NUMBER() AS ErrorNumber,
            ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END
GO
