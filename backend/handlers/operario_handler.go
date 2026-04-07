package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"crud-app/database"
	"crud-app/models"
)

type OperarioHandler struct {
	db *sql.DB
}

func NewOperarioHandler() *OperarioHandler {
	return &OperarioHandler{db: database.GetDB()}
}

func (h *OperarioHandler) jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (h *OperarioHandler) GetOperarios(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query("SELECT id, nombre, gasto_diario FROM operarios ORDER BY id")
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	var operarios []models.Operario
	for rows.Next() {
		var operario models.Operario
		if err := rows.Scan(&operario.ID, &operario.Nombre, &operario.GastoDiario); err != nil {
			h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		operarios = append(operarios, operario)
	}
	if err := rows.Err(); err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	h.jsonResponse(w, http.StatusOK, operarios)
}

func (h *OperarioHandler) GetOperario(w http.ResponseWriter, r *http.Request, id int) {
	var operario models.Operario
	err := h.db.QueryRow("SELECT id, nombre, gasto_diario FROM operarios WHERE id = ?", id).Scan(&operario.ID, &operario.Nombre, &operario.GastoDiario)
	if err != nil {
		if err == sql.ErrNoRows {
			h.jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Operario no encontrado"})
		} else {
			h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return
	}
	h.jsonResponse(w, http.StatusOK, operario)
}

func (h *OperarioHandler) CreateOperario(w http.ResponseWriter, r *http.Request) {
	var operario models.Operario
	if err := json.NewDecoder(r.Body).Decode(&operario); err != nil {
		h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	result, err := h.db.Exec("INSERT INTO operarios (nombre, gasto_diario) VALUES (?, ?)",
		operario.Nombre, operario.GastoDiario)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	id, _ := result.LastInsertId()
	operario.ID = int(id)
	h.jsonResponse(w, http.StatusCreated, operario)
}

func (h *OperarioHandler) UpdateOperario(w http.ResponseWriter, r *http.Request, id int) {
	var operario models.Operario
	if err := json.NewDecoder(r.Body).Decode(&operario); err != nil {
		h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	_, err := h.db.Exec("UPDATE operarios SET nombre = ?, gasto_diario = ? WHERE id = ?",
		operario.Nombre, operario.GastoDiario, id)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	operario.ID = id
	h.jsonResponse(w, http.StatusOK, operario)
}

func (h *OperarioHandler) DeleteOperario(w http.ResponseWriter, r *http.Request, id int) {
	_, err := h.db.Exec("DELETE FROM operarios WHERE id = ?", id)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	h.jsonResponse(w, http.StatusOK, map[string]string{"message": "Operario eliminado"})
}
