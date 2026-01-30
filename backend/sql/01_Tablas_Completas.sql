-- =============================================
-- Database: CotizappBD
-- Description: Schema creation for Cotizaciones PTY
-- =============================================

USE CotizappBD;
GO

-- =============================================
-- 1. Users & Profiles
-- =============================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_Usuarios' AND xtype='U')
CREATE TABLE tbl_Usuarios (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Nombre NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Telefono NVARCHAR(20),
    TipoUsuario NVARCHAR(20) NOT NULL CHECK (TipoUsuario IN ('Cliente', 'Proveedor')),
    FechaRegistro DATETIME DEFAULT GETDATE(),
    Activo BIT DEFAULT 1
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_ProveedoresPerfil' AND xtype='U')
CREATE TABLE tbl_ProveedoresPerfil (
    UsuarioId UNIQUEIDENTIFIER PRIMARY KEY FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    Categoria NVARCHAR(50) NOT NULL,
    Descripcion NVARCHAR(MAX),
    RadioCoberturaKM INT DEFAULT 10,
    UbicacionLat FLOAT,
    UbicacionLng FLOAT,
    UbicacionDistrito NVARCHAR(100),
    Rating DECIMAL(3, 2) DEFAULT 0,
    CantidadResenas INT DEFAULT 0,
    TiempoRespuesta NVARCHAR(50),
    EsPremium BIT DEFAULT 0,
    SolicitudesRespondidasMes INT DEFAULT 0,
    FechaActualizacion DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 2. Service Requests (Cotizaciones)
-- =============================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_SolicitudesServicio' AND xtype='U')
CREATE TABLE tbl_SolicitudesServicio (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClienteId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    Categoria NVARCHAR(50) NOT NULL,
    Descripcion NVARCHAR(MAX) NOT NULL,
    FotosJson NVARCHAR(MAX), -- JSON array of URLs
    RespuestasGuiadasJson NVARCHAR(MAX), -- JSON object
    UbicacionLat FLOAT,
    UbicacionLng FLOAT,
    UbicacionDireccion NVARCHAR(200),
    Estado NVARCHAR(20) NOT NULL DEFAULT 'Abierta', -- Abierta, Cerrada, Cancelada
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FechaExpiracion DATETIME
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_CotizacionesServicio' AND xtype='U')
CREATE TABLE tbl_CotizacionesServicio (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SolicitudId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_SolicitudesServicio(Id),
    ProveedorId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    Precio DECIMAL(10, 2) NOT NULL,
    Mensaje NVARCHAR(MAX),
    TiempoEstimado NVARCHAR(50),
    Estado NVARCHAR(20) NOT NULL DEFAULT 'Pendiente', -- Pendiente, Aceptada, Rechazada
    FechaCreacion DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 3. Products Marketplace
-- =============================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_Productos' AND xtype='U')
CREATE TABLE tbl_Productos (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProveedorId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    Titulo NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(MAX),
    Precio DECIMAL(10, 2) NOT NULL,
    Condicion NVARCHAR(20), -- Nuevo, Usado
    Stock INT DEFAULT 1,
    ImagenesJson NVARCHAR(MAX),
    Categoria NVARCHAR(50),
    Activo BIT DEFAULT 1,
    FechaCreacion DATETIME DEFAULT GETDATE()
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_NegociacionesProducto' AND xtype='U')
CREATE TABLE tbl_NegociacionesProducto (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProductoId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Productos(Id),
    ClienteId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    ProveedorId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    PrecioOriginal DECIMAL(10, 2) NOT NULL,
    OfertaActual DECIMAL(10, 2) NOT NULL,
    UltimoEmisorId UNIQUEIDENTIFIER NOT NULL, -- Quien hizo la ultima oferta
    Estado NVARCHAR(20) DEFAULT 'Negociando', -- Negociando, Aceptada, Rechazada
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FechaActualizacion DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 4. Communication & Chat
-- =============================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_Conversaciones' AND xtype='U')
CREATE TABLE tbl_Conversaciones (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TipoRelacion NVARCHAR(20) NOT NULL, -- 'Servicio' o 'Producto'
    RelacionId UNIQUEIDENTIFIER NOT NULL, -- ID de Solicitud o Negociacion
    ClienteId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    ProveedorId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    FechaUltimoMensaje DATETIME DEFAULT GETDATE(),
    Activa BIT DEFAULT 1
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_MensajesChat' AND xtype='U')
CREATE TABLE tbl_MensajesChat (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ConversacionId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Conversaciones(Id),
    EmisorId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    Contenido NVARCHAR(MAX),
    Tipo NVARCHAR(20) DEFAULT 'Texto', -- Texto, Imagen, Cotizacion, Sistema
    FechaEnvio DATETIME DEFAULT GETDATE(),
    Leido BIT DEFAULT 0
);
GO

-- =============================================
-- 5. Ratings
-- =============================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_Calificaciones' AND xtype='U')
CREATE TABLE tbl_Calificaciones (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EntidadTipo NVARCHAR(20) NOT NULL, -- Solicitud, Producto
    EntidadId UNIQUEIDENTIFIER NOT NULL,
    ClienteId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    ProveedorId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tbl_Usuarios(Id),
    Puntaje INT NOT NULL CHECK (Puntaje BETWEEN 1 AND 5),
    Comentario NVARCHAR(MAX),
    FechaCreacion DATETIME DEFAULT GETDATE()
);
GO
