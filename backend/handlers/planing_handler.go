package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"crud-app/database"
	"crud-app/models"
)

type PlaningHandler struct {
	db *sql.DB
}

func NewPlaningHandler() *PlaningHandler {
	return &PlaningHandler{db: database.GetDB()}
}

func (h *PlaningHandler) jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (h *PlaningHandler) GetPlanings(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT p.id, p.fecha, p.operario_id, p.obra_id,
		       o.nombre as operario_nombre,
		       ob.nombre as obra_nombre
		FROM planing p
		LEFT JOIN operarios o ON p.operario_id = o.id
		LEFT JOIN obras ob ON p.obra_id = ob.id
		ORDER BY p.id`
	rows, err := h.db.Query(query)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	var planings []models.Planing
	for rows.Next() {
		var planing models.Planing
		if err := rows.Scan(&planing.ID, &planing.Fecha, &planing.OperarioID, &planing.ObraID, &planing.OperarioNombre, &planing.ObraNombre); err != nil {
			h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		planings = append(planings, planing)
	}
	if err := rows.Err(); err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	h.jsonResponse(w, http.StatusOK, planings)
}

func (h *PlaningHandler) GetPlaning(w http.ResponseWriter, r *http.Request, id int) {
	var planing models.Planing
	query := `
		SELECT p.id, p.fecha, p.operario_id, p.obra_id,
		       o.nombre as operario_nombre,
		       ob.nombre as obra_nombre
		FROM planing p
		LEFT JOIN operarios o ON p.operario_id = o.id
		LEFT JOIN obras ob ON p.obra_id = ob.id
		WHERE p.id = ?`
	err := h.db.QueryRow(query, id).Scan(&planing.ID, &planing.Fecha, &planing.OperarioID, &planing.ObraID, &planing.OperarioNombre, &planing.ObraNombre)
	if err != nil {
		if err == sql.ErrNoRows {
			h.jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Planing no encontrado"})
		} else {
			h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return
	}
	h.jsonResponse(w, http.StatusOK, planing)
}

func (h *PlaningHandler) CreatePlaning(w http.ResponseWriter, r *http.Request) {
	var planing models.Planing
	if err := json.NewDecoder(r.Body).Decode(&planing); err != nil {
		h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	result, err := h.db.Exec("INSERT INTO planing (fecha, operario_id, obra_id) VALUES (?, ?, ?)",
		planing.Fecha, planing.OperarioID, planing.ObraID)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	id, err := result.LastInsertId()
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	// Obtener el planing completo con nombres
	var fullPlaning models.Planing
	query := `
		SELECT p.id, p.fecha, p.operario_id, p.obra_id,
		       o.nombre as operario_nombre,
		       ob.nombre as obra_nombre
		FROM planing p
		LEFT JOIN operarios o ON p.operario_id = o.id
		LEFT JOIN obras ob ON p.obra_id = ob.id
		WHERE p.id = ?`
	err = h.db.QueryRow(query, id).Scan(&fullPlaning.ID, &fullPlaning.Fecha, &fullPlaning.OperarioID, &fullPlaning.ObraID, &fullPlaning.OperarioNombre, &fullPlaning.ObraNombre)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	h.jsonResponse(w, http.StatusCreated, fullPlaning)
}

func (h *PlaningHandler) UpdatePlaning(w http.ResponseWriter, r *http.Request, id int) {
	var planing models.Planing
	if err := json.NewDecoder(r.Body).Decode(&planing); err != nil {
		h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	_, err := h.db.Exec("UPDATE planing SET fecha = ?, operario_id = ?, obra_id = ? WHERE id = ?",
		planing.Fecha, planing.OperarioID, planing.ObraID, id)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	// Obtener el planing actualizado con nombres
	var fullPlaning models.Planing
	query := `
		SELECT p.id, p.fecha, p.operario_id, p.obra_id,
		       o.nombre as operario_nombre,
		       ob.nombre as obra_nombre
		FROM planing p
		LEFT JOIN operarios o ON p.operario_id = o.id
		LEFT JOIN obras ob ON p.obra_id = ob.id
		WHERE p.id = ?`
	err = h.db.QueryRow(query, id).Scan(&fullPlaning.ID, &fullPlaning.Fecha, &fullPlaning.OperarioID, &fullPlaning.ObraID, &fullPlaning.OperarioNombre, &fullPlaning.ObraNombre)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	h.jsonResponse(w, http.StatusOK, fullPlaning)
}

func (h *PlaningHandler) DeletePlaning(w http.ResponseWriter, r *http.Request, id int) {
	_, err := h.db.Exec("DELETE FROM planing WHERE id = ?", id)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	h.jsonResponse(w, http.StatusOK, map[string]string{"message": "Planing eliminado"})
}

// GetPlaningsByDate obtiene todas las asignaciones para una fecha específica
// Devuelve un array simple de pares {obra_id, operario_id}
func (h *PlaningHandler) GetPlaningsByDate(w http.ResponseWriter, r *http.Request, fecha string) {
	query := `SELECT obra_id, operario_id FROM planing WHERE fecha = ? ORDER BY obra_id, operario_id`
	rows, err := h.db.Query(query, fecha)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	type Assignment struct {
		ObraID     int `json:"obra_id"`
		OperarioID int `json:"operario_id"`
	}

	var assignments []Assignment
	for rows.Next() {
		var a Assignment
		if err := rows.Scan(&a.ObraID, &a.OperarioID); err != nil {
			h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		assignments = append(assignments, a)
	}
	if err := rows.Err(); err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	h.jsonResponse(w, http.StatusOK, assignments)
}

// BatchUpdatePlanings procesa múltiples operaciones de asignación/desasignación en una transacción
func (h *PlaningHandler) BatchUpdatePlanings(w http.ResponseWriter, r *http.Request) {
	type BatchOp struct {
		Type       string `json:"type"` // "add" o "remove"
		ObraID     int    `json:"obra_id"`
		OperarioID int    `json:"operario_id"`
	}
	type BatchRequest struct {
		Fecha      string    `json:"fecha"`
		Operations []BatchOp `json:"operations"`
	}

	var req BatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	// Validación básica
	if req.Fecha == "" {
		h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Fecha requerida"})
		return
	}

	// Iniciar transacción
	tx, err := h.db.Begin()
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer tx.Rollback()

	// Procesar cada operación
	for _, op := range req.Operations {
		if op.Type == "add" {
			// Intentar INSERT, ignorar si ya existe (por la unique constraint)
			_, err := tx.Exec("INSERT OR IGNORE INTO planing (fecha, obra_id, operario_id) VALUES (?, ?, ?)",
				req.Fecha, op.ObraID, op.OperarioID)
			if err != nil {
				h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
				return
			}
		} else if op.Type == "remove" {
			_, err := tx.Exec("DELETE FROM planing WHERE fecha = ? AND obra_id = ? AND operario_id = ?",
				req.Fecha, op.ObraID, op.OperarioID)
			if err != nil {
				h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
				return
			}
		} else {
			h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Tipo de operación inválido: " + op.Type})
			return
		}
	}

	// Commit transacción
	if err := tx.Commit(); err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	h.jsonResponse(w, http.StatusOK, map[string]string{"message": "Operaciones procesadas exitosamente"})
}
