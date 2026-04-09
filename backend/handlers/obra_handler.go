package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
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
		rows, err = h.db.Query("SELECT id, nombre, valor_contrato, estado, fecha_inicio FROM obras WHERE estado = ? ORDER BY id", estado)
	} else {
		rows, err = h.db.Query("SELECT id, nombre, valor_contrato, estado, fecha_inicio FROM obras ORDER BY id")
	}

	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	var obras []models.Obra
	for rows.Next() {
		var obra models.Obra
		var fechaInicio sql.NullString
		if err := rows.Scan(&obra.ID, &obra.Nombre, &obra.ValorContrato, &obra.Estado, &fechaInicio); err != nil {
			h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		if fechaInicio.Valid {
			obra.FechaInicio = fechaInicio.String
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
	var fechaInicio sql.NullString
	err := h.db.QueryRow("SELECT id, nombre, valor_contrato, estado, fecha_inicio FROM obras WHERE id = ?", id).Scan(&obra.ID, &obra.Nombre, &obra.ValorContrato, &obra.Estado, &fechaInicio)
	if err != nil {
		if err == sql.ErrNoRows {
			h.jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Obra no encontrada"})
		} else {
			h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return
	}
	if fechaInicio.Valid {
		obra.FechaInicio = fechaInicio.String
	}
	h.jsonResponse(w, http.StatusOK, obra)
}

func (h *ObraHandler) CreateObra(w http.ResponseWriter, r *http.Request) {
	var obra models.Obra
	if err := json.NewDecoder(r.Body).Decode(&obra); err != nil {
		h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	var result sql.Result
	var err error

	// Si se proporciona un ID, usarlo; de lo contrario, dejar que SQLite genere uno
	if obra.ID > 0 {
		result, err = h.db.Exec("INSERT INTO obras (id, nombre, valor_contrato, estado, fecha_inicio) VALUES (?, ?, ?, ?, ?)",
			obra.ID, obra.Nombre, obra.ValorContrato, obra.Estado, obra.FechaInicio)
	} else {
		result, err = h.db.Exec("INSERT INTO obras (nombre, valor_contrato, estado, fecha_inicio) VALUES (?, ?, ?, ?)",
			obra.Nombre, obra.ValorContrato, obra.Estado, obra.FechaInicio)
	}

	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// Si no se proporcionó ID, obtener el generado automáticamente
	if obra.ID == 0 {
		id, _ := result.LastInsertId()
		obra.ID = int(id)
	}

	// Obtener el registro recién creado de la base de datos
	var createdObra models.Obra
	var fechaInicio sql.NullString
	err = h.db.QueryRow("SELECT id, nombre, valor_contrato, estado, fecha_inicio FROM obras WHERE id = ?", obra.ID).Scan(
		&createdObra.ID, &createdObra.Nombre, &createdObra.ValorContrato, &createdObra.Estado, &fechaInicio)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if fechaInicio.Valid {
		createdObra.FechaInicio = fechaInicio.String
	}

	h.jsonResponse(w, http.StatusCreated, createdObra)
}

func (h *ObraHandler) UpdateObra(w http.ResponseWriter, r *http.Request, id int) {
	var obra models.Obra
	if err := json.NewDecoder(r.Body).Decode(&obra); err != nil {
		h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	// Log para depuración
	fmt.Printf("UpdateObra - ID: %d, Nombre: %s, FechaInicio: %s\n", id, obra.Nombre, obra.FechaInicio)

	_, err := h.db.Exec("UPDATE obras SET nombre = ?, valor_contrato = ?, estado = ?, fecha_inicio = ? WHERE id = ?",
		obra.Nombre, obra.ValorContrato, obra.Estado, obra.FechaInicio, id)
	if err != nil {
		fmt.Printf("UpdateObra - Error en UPDATE: %v\n", err)
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	// Obtener el registro actualizado de la base de datos
	var updatedObra models.Obra
	var fechaInicio sql.NullString
	err = h.db.QueryRow("SELECT id, nombre, valor_contrato, estado, fecha_inicio FROM obras WHERE id = ?", id).Scan(
		&updatedObra.ID, &updatedObra.Nombre, &updatedObra.ValorContrato, &updatedObra.Estado, &fechaInicio)
	if err != nil {
		fmt.Printf("UpdateObra - Error en SELECT después de UPDATE: %v\n", err)
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if fechaInicio.Valid {
		updatedObra.FechaInicio = fechaInicio.String
	}

	fmt.Printf("UpdateObra - Registro actualizado: ID: %d, FechaInicio: %s\n", updatedObra.ID, updatedObra.FechaInicio)
	h.jsonResponse(w, http.StatusOK, updatedObra)
}

func (h *ObraHandler) DeleteObra(w http.ResponseWriter, r *http.Request, id int) {
	_, err := h.db.Exec("DELETE FROM obras WHERE id = ?", id)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	h.jsonResponse(w, http.StatusOK, map[string]string{"message": "Obra eliminada"})
}
