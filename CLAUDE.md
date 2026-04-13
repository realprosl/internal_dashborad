# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack CRUD application for managing construction projects ("obras"), workers ("operarios"), daily assignments ("planing"), and materials ("materiales"). The application features:
- **Backend**: Go (Gin-like HTTP server) with SQLite database
- **Frontend**: SolidJS with TypeScript, Tailwind CSS, and dark/light theme support
- **Database**: SQLite with `planing.db` file in project root

## Architecture

### Backend Structure (`backend/`)
- `main.go`: HTTP server with CORS middleware and API routing
- `database/database.go`: SQLite connection management
- `models/`: Data structures (Obra, Operario, Planing, Material)
- `handlers/`: HTTP request handlers for each entity

### Frontend Structure (`frontend/`)
- `src/App.tsx`: Main application with SolidJS router
- `src/pages/`: Page components (Dashboard, Obras, Operarios, Planing, Materiales)
- `src/components/`: Reusable components (Layout, Icons, DailyAssignmentModal, Notification)
- `src/contexts/ThemeContext.tsx`: Dark/light theme management
- `src/store/index.ts`: Centralized state management with CRUD operations
- `src/types/index.ts`: TypeScript type definitions
- `src/utils/`: Utility functions (sorting, filtering, number formatting)
- Built with Vite, TypeScript, and Tailwind CSS

### API Endpoints
All endpoints are prefixed with `/api/`:
- `GET/POST /api/obras` - List/create construction projects
- `GET/PUT/DELETE /api/obras/:id` - Get/update/delete specific project
- `GET/POST /api/operarios` - List/create workers
- `GET/PUT/DELETE /api/operarios/:id` - Get/update/delete specific worker
- `GET/POST /api/planings` - List/create daily assignments (includes JOINs for names)
- `GET/PUT/DELETE /api/planings/:id` - Get/update/delete specific assignment
- `GET /api/planings/date/:date` - Get assignments by date
- `POST /api/planings/batch` - Batch update assignments
- `GET/POST /api/materiales` - List/create materials
- `GET/PUT/DELETE /api/materiales/:id` - Get/update/delete specific material

### Database Schema
- `obras(id, nombre, valor_contrato, estado)`
- `operarios(id, nombre, gasto_diario)`
- `planing(id, fecha, operario_id, obra_id)`
- `materiales(id, fecha, obra_id, descripcion, precio, unidad, unidades, estado)`

## Development Commands

### Backend (Go)
```bash
cd backend
go mod tidy                    # Install dependencies
go run main.go                # Run development server (port 8080)
go build -o app main.go       # Build binary
go test ./...                 # Run tests
go fmt ./...                  # Format code
go vet ./...                  # Static analysis
```

### Frontend (SolidJS)
```bash
cd frontend
npm install                   # Install dependencies
npm run dev                   # Run development server (port 5173)
npm run build                 # Build for production
npm run type-check            # TypeScript type checking
npm run preview               # Preview production build
```

### Combined Development
```bash
./run                         # Run both backend and frontend (from project root)
```

## Key Implementation Patterns

### Backend Patterns
- Handlers follow RESTful conventions with manual routing (no Gin framework)
- Database queries use `database/sql` with prepared statements
- JSON responses with consistent error handling
- CORS enabled for all origins (`Access-Control-Allow-Origin: *`)

### Frontend Patterns
- SolidJS reactive components with TypeScript
- Theme context for dark/light mode (persists in localStorage)
- Modal-based forms for create/edit operations
- Table components with search, sort, and hover actions
- API calls use `fetch()` with error handling

## File Locations
- Database: `planing.db` (project root)
- Frontend build: `frontend/dist/`
- Backend binary: `backend/app` (when built)
- Run script: `./run` (starts both services)

## Recent Implementation Details

### Materials Table Implementation
- **Frontend**: Materials table displays 5 columns (Fecha, Obra, Descripción, Total, Estado)
- **Calculated Total**: Total field calculated as `precio × unidades` in frontend
- **State Display**: Uses colored badges instead of dropdowns in table view
- **State Cycling**: Clicking on state badge cycles through available states
- **Partial Updates**: Backend supports partial updates to prevent field resets

### Key Fixes Applied
1. **Removed price and units columns**: Replaced with calculated total column
2. **Fixed state display**: Changed from select dropdown to formatted badges
3. **Fixed edit click issue**: Removed interfering select elements that blocked row clicks
4. **Fixed field reset issue**: Implemented partial update support in backend handler
5. **Improved sorting**: Added support for sorting by calculated total field
6. **State display consistency**: Changed state from clickable button to static formatted text (matching obras and operarios tables)

### Backend Handler Updates
- `material_handler.go` implements partial update support using `map[string]interface{}`
- `UpdateMaterial` fetches current record first, then merges with provided updates
- Proper type conversion for JSON numbers (float64 to int for obra_id)
- All handlers follow consistent error handling patterns

### Frontend Features
- Table sorting supports calculated fields via custom `getSortValue` function
- Filtering and search functionality across all table columns
- Modal-based forms for create/edit operations
- Real-time state updates with visual feedback
- Spanish locale number formatting for decimal values

## Notes for Development
1. The backend serves the frontend from `frontend/dist/` when built
2. API runs on port 8080, frontend dev server on port 5173
3. Database file path is resolved relative to executable or working directory
4. No authentication is currently implemented
5. Batch operations available for planing assignments
6. Spanish terminology used throughout (obras, operarios, planing, materiales)
7. Materials table uses calculated total field (precio × unidades)
8. State changes use partial updates to prevent data loss
9. All API endpoints support partial updates for individual fields