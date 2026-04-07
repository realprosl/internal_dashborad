package main

import (
	"encoding/json"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"crud-app/database"
	"crud-app/handlers"
)

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
	}
}

func parseIDFromPath(path, prefix string) (int, bool) {
	if !strings.HasPrefix(path, prefix) {
		return 0, false
	}
	idStr := strings.TrimPrefix(path, prefix)
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, false
	}
	return id, true
}

func main() {
	if err := database.Init(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.Close()

	obraHandler := handlers.NewObraHandler()
	operarioHandler := handlers.NewOperarioHandler()
	planingHandler := handlers.NewPlaningHandler()

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/obras", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			obraHandler.GetObras(w, r)
		case http.MethodPost:
			obraHandler.CreateObra(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/obras/", func(w http.ResponseWriter, r *http.Request) {
		id, ok := parseIDFromPath(r.URL.Path, "/api/obras/")
		if !ok {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		switch r.Method {
		case http.MethodGet:
			obraHandler.GetObra(w, r, id)
		case http.MethodPut:
			obraHandler.UpdateObra(w, r, id)
		case http.MethodDelete:
			obraHandler.DeleteObra(w, r, id)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/operarios", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			operarioHandler.GetOperarios(w, r)
		case http.MethodPost:
			operarioHandler.CreateOperario(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/operarios/", func(w http.ResponseWriter, r *http.Request) {
		id, ok := parseIDFromPath(r.URL.Path, "/api/operarios/")
		if !ok {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		switch r.Method {
		case http.MethodGet:
			operarioHandler.GetOperario(w, r, id)
		case http.MethodPut:
			operarioHandler.UpdateOperario(w, r, id)
		case http.MethodDelete:
			operarioHandler.DeleteOperario(w, r, id)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/planings", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			planingHandler.GetPlanings(w, r)
		case http.MethodPost:
			planingHandler.CreatePlaning(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/planings/", func(w http.ResponseWriter, r *http.Request) {
		id, ok := parseIDFromPath(r.URL.Path, "/api/planings/")
		if !ok {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		switch r.Method {
		case http.MethodGet:
			planingHandler.GetPlaning(w, r, id)
		case http.MethodPut:
			planingHandler.UpdatePlaning(w, r, id)
		case http.MethodDelete:
			planingHandler.DeletePlaning(w, r, id)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Endpoint para obtener asignaciones por fecha
	mux.HandleFunc("/api/planings/date/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		fecha := strings.TrimPrefix(r.URL.Path, "/api/planings/date/")
		if fecha == "" {
			http.Error(w, "Fecha requerida", http.StatusBadRequest)
			return
		}
		planingHandler.GetPlaningsByDate(w, r, fecha)
	})

	// Endpoint para procesar operaciones en lote
	mux.HandleFunc("/api/planings/batch", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		planingHandler.BatchUpdatePlanings(w, r)
	})

	// Servir archivos estáticos del frontend
	frontendDist := filepath.Join("..", "frontend", "dist")
	absFrontendDist, err := filepath.Abs(frontendDist)
	if err != nil {
		log.Println("Warning: cannot get absolute path, using relative:", err)
		absFrontendDist = frontendDist
	} else {
		frontendDist = absFrontendDist
	}
	log.Println("Serving frontend from:", frontendDist)

	// Servir archivos estáticos
	assetsPath := filepath.Join(frontendDist, "assets")
	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(assetsPath))))

	// Servir index.html para cualquier otra ruta (SPA)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || !strings.HasPrefix(r.URL.Path, "/api") && !strings.HasPrefix(r.URL.Path, "/assets") {
			http.ServeFile(w, r, filepath.Join(frontendDist, "index.html"))
			return
		}
		http.NotFound(w, r)
	})

	handler := enableCORS(mux)

	log.Println("Server starting on 0.0.0.0:8080")
	if err := http.ListenAndServe("0.0.0.0:8080", handler); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
