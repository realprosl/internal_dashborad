# CRUD App - Obras, Operarios, Planing

Aplicación full-stack con backend en Go (Gin) y frontend en SolidJS con Tailwind CSS.

## Estructura

- `backend/`: API REST en Go con SQLite
- `frontend/`: Aplicación Solid con enrutamiento y modo oscuro

## Requisitos

- Go 1.25+
- Node.js 18+
- SQLite3

## Configuración

### Backend

1. Ir al directorio `backend`:
   ```bash
   cd backend
   ```
2. Instalar dependencias:
   ```bash
   go mod tidy
   ```
3. Ejecutar el servidor (puerto 8080):
   ```bash
   go run main.go
   ```

### Frontend

1. Ir al directorio `frontend`:
   ```bash
   cd frontend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Ejecutar servidor de desarrollo (puerto 5173):
   ```bash
   npm run dev
   ```

## Características

- **CRUD completo** para tres tablas: Obras, Operarios, Planing.
- **Buscador** en cada tabla que filtra por cualquier campo.
- **Ordenamiento** por columna (click en encabezado).
- **Botones de editar/eliminar** que aparecen al hacer hover/focus.
- **Modo oscuro/claro** con toggle.
- **Diseño moderno** con Tailwind CSS.
- **Responsive**.

## Endpoints API

- `GET /api/obras` - Listar obras
- `POST /api/obras` - Crear obra
- `PUT /api/obras/:id` - Actualizar obra
- `DELETE /api/obras/:id` - Eliminar obra

- `GET /api/operarios` - Listar operarios
- `POST /api/operarios` - Crear operario
- `PUT /api/operarios/:id` - Actualizar operario
- `DELETE /api/operarios/:id` - Eliminar operario

- `GET /api/planings` - Listar planings (con nombres de operario y obra)
- `POST /api/planings` - Crear planing
- `PUT /api/planings/:id` - Actualizar planing
- `DELETE /api/planings/:id` - Eliminar planing

## Base de datos

SQLite con archivo `planing.db` en la raíz del proyecto. Contiene las tablas:

- `obras(id, nombre, valor_contrato, estado)`
- `operarios(id, nombre, gasto_diario)`
- `planing(id, fecha, operario_id, obra_id)`

## Notas

- El frontend se comunica con el backend en `http://localhost:8080` (CORS configurado).
- El modo oscuro guarda preferencia en localStorage.
- Los botones de eliminar requieren confirmación.
- La creación y edición se realizan mediante modales.

## Pendientes

- Validación de formularios.
- Mejores mensajes de error.
- Paginación.
- Exportar datos.
- Autenticación (si se requiere).