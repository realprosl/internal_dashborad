# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack CRUD application for managing construction projects ("obras"), workers ("operarios"), and daily assignments ("planing"). The application features:
- **Backend**: Go (Gin-like HTTP server) with SQLite database
- **Frontend**: SolidJS with TypeScript, Tailwind CSS, and dark/light theme support
- **Database**: SQLite with `planing.db` file in project root

## Architecture

### Backend Structure (`backend/`)
- `main.go`: HTTP server with CORS middleware and API routing
- `database/database.go`: SQLite connection management
- `models/`: Data structures (Obra, Operario, Planing)
- `handlers/`: HTTP request handlers for each entity

### Frontend Structure (`frontend/`)
- `src/App.tsx`: Main application with SolidJS router
- `src/pages/`: Page components (Dashboard, Obras, Operarios, Planing)
- `src/components/`: Reusable components (Layout, Icons, DailyAssignmentModal)
- `src/contexts/ThemeContext.tsx`: Dark/light theme management
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

### Database Schema
- `obras(id, nombre, valor_contrato, estado)`
- `operarios(id, nombre, gasto_diario)`
- `planing(id, fecha, operario_id, obra_id)`

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

## Notes for Development
1. The backend serves the frontend from `frontend/dist/` when built
2. API runs on port 8080, frontend dev server on port 5173
3. Database file path is resolved relative to executable or working directory
4. No authentication is currently implemented
5. Batch operations available for planing assignments
6. Spanish terminology used throughout (obras, operarios, planing)