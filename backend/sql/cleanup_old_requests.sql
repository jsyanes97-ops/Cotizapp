-- Clean up old requests and update FechaExpiracion for existing ones
USE CotizappBD;
GO

-- Update all existing requests without FechaExpiracion to expire in 5 minutes
UPDATE tbl_SolicitudesServicio
SET FechaExpiracion = DATEADD(MINUTE, 5, GETDATE())
WHERE FechaExpiracion IS NULL
AND Estado = 'Abierta';

-- Delete very old requests (older than 1 day)
DELETE FROM tbl_SolicitudesServicio
WHERE FechaCreacion < DATEADD(DAY, -1, GETDATE())
AND Estado = 'Abierta';

SELECT 'Cleanup complete' AS Status;
GO
