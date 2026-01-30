USE CotizappBD;
GO

-- =============================================
-- SP: Gestionar Usuario (Register / Update)
-- =============================================
CREATE OR ALTER PROCEDURE sp_GestionarUsuario
    @Accion NVARCHAR(20), -- 'INSERT', 'UPDATE'
    @Id UNIQUEIDENTIFIER = NULL,
    @Nombre NVARCHAR(100) = NULL,
    @Email NVARCHAR(100) = NULL,
    @PasswordHash NVARCHAR(MAX) = NULL,
    @Telefono NVARCHAR(20) = NULL,
    @TipoUsuario NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Accion = 'INSERT'
    BEGIN
        IF EXISTS (SELECT 1 FROM tbl_Usuarios WHERE Email = @Email)
        BEGIN
            RAISERROR('El email ya está registrado.', 16, 1);
            RETURN;
        END

        INSERT INTO tbl_Usuarios (Nombre, Email, PasswordHash, Telefono, TipoUsuario)
        OUTPUT INSERTED.Id
        VALUES (@Nombre, @Email, @PasswordHash, @Telefono, @TipoUsuario);
    END
    ELSE IF @Accion = 'UPDATE'
    BEGIN
        UPDATE tbl_Usuarios
        SET Nombre = ISNULL(@Nombre, Nombre),
            Telefono = ISNULL(@Telefono, Telefono)
        WHERE Id = @Id;

        SELECT @Id AS Id;
    END
END
GO

-- =============================================
-- SP: Login Usuario
-- =============================================
CREATE OR ALTER PROCEDURE sp_LoginUsuario
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, Nombre, Email, PasswordHash, TipoUsuario
    FROM tbl_Usuarios
    WHERE Email = @Email AND Activo = 1;
END
GO

-- =============================================
-- SP: Gestionar Perfil Proveedor
-- =============================================
CREATE OR ALTER PROCEDURE sp_GestionarPerfilProveedor
    @UsuarioId UNIQUEIDENTIFIER,
    @Categoria NVARCHAR(50),
    @Descripcion NVARCHAR(MAX),
    @RadioCoberturaKM INT,
    @UbicacionLat FLOAT,
    @UbicacionLng FLOAT,
    @UbicacionDistrito NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM tbl_ProveedoresPerfil WHERE UsuarioId = @UsuarioId)
    BEGIN
        UPDATE tbl_ProveedoresPerfil
        SET Categoria = @Categoria,
            Descripcion = @Descripcion,
            RadioCoberturaKM = @RadioCoberturaKM,
            UbicacionLat = @UbicacionLat,
            UbicacionLng = @UbicacionLng,
            UbicacionDistrito = @UbicacionDistrito,
            FechaActualizacion = GETDATE()
        WHERE UsuarioId = @UsuarioId;
    END
    ELSE
    BEGIN
        INSERT INTO tbl_ProveedoresPerfil (UsuarioId, Categoria, Descripcion, RadioCoberturaKM, UbicacionLat, UbicacionLng, UbicacionDistrito)
        VALUES (@UsuarioId, @Categoria, @Descripcion, @RadioCoberturaKM, @UbicacionLat, @UbicacionLng, @UbicacionDistrito);
    END
END
GO
