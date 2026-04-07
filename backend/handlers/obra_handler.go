package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"crud-app/database"
	"crud-app/models"
)

type ObraHandler struct {
	db *sql.DB
}

func NewObraHandler() *ObraHandler {
	return &ObraHandler{db: database.GetDB()}
}

func (h *ObraHandler) jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (h *ObraHandler) GetObras(w http.ResponseWriter, r *http.Request) {
	estado := r.URL.Query().Get("estado")
	var rows *sql.Rows
	var err error

	if estado != "" {
		rows, err = h.db.Query("SELECT id, nombre, valor_contrato, estado FROM obras WHERE estado = ? ORDER BY id", estado)
	} else {
		rows, err = h.db.Query("SELECT id, nombre, valor_contrato, estado FROM obras ORDER BY id")
	}

	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	var obras []models.Obra
	for rows.Next() {
		var obra models.Obra
		if err := rows.Scan(&obra.ID, &obra.Nombre, &obra.ValorContrato, &obra.Estado); err != nil {
			h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		obras = append(obras, obra)
	}
	if err := rows.Err(); err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	h.jsonResponse(w, http.StatusOK, obras)
}

func (h *ObraHandler) GetObra(w http.ResponseWriter, r *http.Request, id int) {
	var obra models.Obra
	err := h.db.QueryRow("SELECT id, nombre, valor_contrato, estado FROM obras WHERE id = ?", id).Scan(&obra.ID, &obra.Nombre, &obra.ValorContrato, &obra.Estado)
	if err != nil {
		if err == sql.ErrNoRows {
			h.jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Obra no encontrada"})
		} else {
			h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return
	}
	h.jsonResponse(w, http.StatusOK, obra)
}

func (h *ObraHandler) CreateObra(w http.ResponseWriter, r *http.Request) {
	var obra models.Obra
	if err := json.NewDecoder(r.Body).Decode(&obra); err != nil {
		h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	result, err := h.db.Exec("INSERT INTO obras (nombre, valor_contrato, estado) VALUES (?, ?, ?)",
		obra.Nombre, obra.ValorContrato, obra.Estado)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	id, _ := result.LastInsertId()
	obra.ID = int(id)
	h.jsonResponse(w, http.StatusCreated, obra)
}

func (h *ObraHandler) UpdateObra(w http.ResponseWriter, r *http.Request, id int) {
	var obra models.Obra
	if err := json.NewDecoder(r.Body).Decode(&obra); err != nil {
		h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	_, err := h.db.Exec("UPDATE obras SET nombre = ?, valor_contrato = ?, estado = ? WHERE id = ?",
		obra.Nombre, obra.ValorContrato, obra.Estado, id)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	obra.ID = id
	h.jsonResponse(w, http.StatusOK, obra)
}

func (h *ObraHandler) DeleteObra(w http.ResponseWriter, r *http.Request, id int) {
	_, err := h.db.Exec("DELETE FROM obras WHERE id = ?", id)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	h.jsonResponse(w, http.StatusOK, map[string]string{"message": "Obra eliminada"})
}
