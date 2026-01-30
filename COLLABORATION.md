# Guía de Colaboración

Esta guía explica cómo trabajar en este proyecto con otras personas.

## 1. Configuración del Repositorio (Solo una vez)

Como el proyecto aún no tiene Git inicializado, primero debes subirlo a GitHub:

1.  **Inicializar Git**: Abre una terminal en la carpeta raíz (`f:\ProjectsAntigravity\One-Pager Product Overview`) y ejecuta:
    ```bash
    git init
    git add .
    git commit -m "Inicializar proyecto"
    ```
    *Nota: Ya he creado un archivo `.gitignore` para que no se suban archivos innecesarios.*

2.  **Crear Repositorio en GitHub**:
    *   Ve a [GitHub.com](https://github.com) y crea un nuevo repositorio (vacío).
    *   Copia la URL del repositorio (ej. `https://github.com/tu-usuario/nombre-repo.git`).

3.  **Subir código**:
    ```bash
    git branch -M main
    git remote add origin <URL_DE_TU_REPOSITORIO>
    git push -u origin main
    ```

4.  **Invitar Colaborador**:
    *   En GitHub, ve a `Settings` > `Collaborators` y añade el email o usuario de la otra persona.

## 2. Para la Otra Persona (Setup)

La otra persona debe seguir estos pasos:

1.  **Clonar el repositorio**:
    ```bash
    git clone <URL_DE_TU_REPOSITORIO>
    cd nombre-repo
    ```

2.  **Instalar dependencias**:
    *   **Backend**: Teniendo instalado .NET SDK 8.
    *   **Frontend**: Teniendo instalado Node.js.
        ```bash
        npm install
        ```

## 3. Ejecutar el Proyecto

Ambos desarrolladores pueden levantar el proyecto igual:

### Backend
El backend se conecta a una base de datos **compartida en Azure**, por lo que ambos verán los mismos datos.
```bash
cd backend/Cotizapp.API
dotnet run
```

### Frontend
```bash
# En la raíz del proyecto
npm run dev
```

## 4. Flujo de Trabajo Recomendado

Para evitar conflictos:

1.  **Crear Ramas**: No trabajen ambos en `main` directamente.
    ```bash
    git checkout -b funcionalidad-nueva
    ```
2.  **Guardar cambios**:
    ```bash
    git add .
    git commit -m "Descripción del cambio"
    git push origin funcionalidad-nueva
    ```
3.  **Pull Request (PR)**: En GitHub, unir la rama con `main`.

## Notas Importantes

*   **Base de Datos**: Actualmente apuntan a `vmserver01.eastus2.cloudapp.azure.com`. ¡Cuidado! Si uno borra datos, el otro también perderá acceso a ellos.
*   **Credenciales**: La contraseña de la base de datos está en el código (`appsettings.json`). En un futuro, es mejor usar "User Secrets" para no compartir contraseñas reales en GitHub público.
