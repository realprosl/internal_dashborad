package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"crud-app/database"
	"crud-app/models"
)

type MaterialHandler struct {
	db *sql.DB
}

func NewMaterialHandler() *MaterialHandler {
	return &MaterialHandler{db: database.GetDB()}
}

func (h *MaterialHandler) jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (h *MaterialHandler) GetMateriales(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT m.id, m.fecha, m.obra_id, m.descripcion, m.precio, m.unidad, m.unidades, m.estado, o.nombre as obra_nombre
		FROM materiales m
		LEFT JOIN obras o ON m.obra_id = o.id
		ORDER BY m.id
	`)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	var materiales []models.Material
	for rows.Next() {
		var materialDB models.MaterialDB
		err := rows.Scan(
			&materialDB.ID,
			&materialDB.Fecha,
			&materialDB.ObraID,
			&materialDB.Descripcion,
			&materialDB.Precio,
			&materialDB.Unidad,
			&materialDB.Unidades,
			&materialDB.Estado,
			&materialDB.ObraNombre,
		)
		if err != nil {
			h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		materiales = append(materiales, materialDB.ToMaterial())
	}
	if err := rows.Err(); err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	h.jsonResponse(w, http.StatusOK, materiales)
}

func (h *MaterialHandler) GetMaterial(w http.ResponseWriter, r *http.Request, id int) {
	var materialDB models.MaterialDB
	err := h.db.QueryRow(`
		SELECT m.id, m.fecha, m.obra_id, m.descripcion, m.precio, m.unidad, m.unidades, m.estado, o.nombre as obra_nombre
		FROM materiales m
		LEFT JOIN obras o ON m.obra_id = o.id
		WHERE m.id = ?
	`, id).Scan(
		&materialDB.ID,
		&materialDB.Fecha,
		&materialDB.ObraID,
		&materialDB.Descripcion,
		&materialDB.Precio,
		&materialDB.Unidad,
		&materialDB.Unidades,
		&materialDB.Estado,
		&materialDB.ObraNombre,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			h.jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Material no encontrado"})
		} else {
			h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return
	}
	h.jsonResponse(w, http.StatusOK, materialDB.ToMaterial())
}

func (h *MaterialHandler) CreateMaterial(w http.ResponseWriter, r *http.Request) {
	var material models.Material
	if err := json.NewDecoder(r.Body).Decode(&material); err != nil {
		h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	var result sql.Result
	var err error

	// Si se proporciona un ID, usarlo; de lo contrario, dejar que SQLite genere uno
	if material.ID > 0 {
		result, err = h.db.Exec(`
			INSERT INTO materiales (id, fecha, obra_id, descripcion, precio, unidad, unidades, estado)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			material.ID, material.Fecha, material.ObraID, material.Descripcion,
			material.Precio, material.Unidad, material.Unidades, material.Estado)
	} else {
		result, err = h.db.Exec(`
			INSERT INTO materiales (fecha, obra_id, descripcion, precio, unidad, unidades, estado)
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
			material.Fecha, material.ObraID, material.Descripcion,
			material.Precio, material.Unidad, material.Unidades, material.Estado)
	}

	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// Si no se proporcionó ID, obtener el generado automáticamente
	if material.ID == 0 {
		id, _ := result.LastInsertId()
		material.ID = int(id)
	}

	// Obtener el registro recién creado de la base de datos
	var createdMaterialDB models.MaterialDB
	err = h.db.QueryRow(`
		SELECT m.id, m.fecha, m.obra_id, m.descripcion, m.precio, m.unidad, m.unidades, m.estado, o.nombre as obra_nombre
		FROM materiales m
		LEFT JOIN obras o ON m.obra_id = o.id
		WHERE m.id = ?
	`, material.ID).Scan(
		&createdMaterialDB.ID,
		&createdMaterialDB.Fecha,
		&createdMaterialDB.ObraID,
		&createdMaterialDB.Descripcion,
		&createdMaterialDB.Precio,
		&createdMaterialDB.Unidad,
		&createdMaterialDB.Unidades,
		&createdMaterialDB.Estado,
		&createdMaterialDB.ObraNombre,
	)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	h.jsonResponse(w, http.StatusCreated, createdMaterialDB.ToMaterial())
}

func (h *MaterialHandler) UpdateMaterial(w http.ResponseWriter, r *http.Request, id int) {
	// Primero obtener el material actual de la base de datos
	var currentMaterialDB models.MaterialDB
	err := h.db.QueryRow(`
		SELECT m.id, m.fecha, m.obra_id, m.descripcion, m.precio, m.unidad, m.unidades, m.estado
		FROM materiales m
		WHERE m.id = ?
	`, id).Scan(
		&currentMaterialDB.ID,
		&currentMaterialDB.Fecha,
		&currentMaterialDB.ObraID,
		&currentMaterialDB.Descripcion,
		&currentMaterialDB.Precio,
		&currentMaterialDB.Unidad,
		&currentMaterialDB.Unidades,
		&currentMaterialDB.Estado,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			h.jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Material no encontrado"})
		} else {
			h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return
	}

	// Decodificar los campos actualizados
	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		h.jsonResponse(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	// Preparar los valores para la actualización
	fecha := currentMaterialDB.Fecha
	if val, ok := updates["fecha"]; ok && val != nil {
		fecha = val.(string)
	}

	obraID := currentMaterialDB.ObraID
	if val, ok := updates["obra_id"]; ok && val != nil {
		// Convertir a float64 primero (JSON numbers son float64) y luego a int
		if floatVal, ok := val.(float64); ok {
			obraID = int(floatVal)
		}
	}

	descripcion := currentMaterialDB.Descripcion
	if val, ok := updates["descripcion"]; ok && val != nil {
		descripcion = val.(string)
	}

	precio := currentMaterialDB.Precio
	if val, ok := updates["precio"]; ok && val != nil {
		precio = val.(float64)
	}

	unidad := currentMaterialDB.Unidad
	if val, ok := updates["unidad"]; ok && val != nil {
		unidad = val.(string)
	}

	unidades := currentMaterialDB.Unidades
	if val, ok := updates["unidades"]; ok && val != nil {
		unidades = val.(float64)
	}

	estado := currentMaterialDB.Estado
	if val, ok := updates["estado"]; ok && val != nil {
		estado = val.(string)
	}

	// Actualizar en la base de datos
	_, err = h.db.Exec(`
		UPDATE materiales
		SET fecha = ?, obra_id = ?, descripcion = ?, precio = ?, unidad = ?, unidades = ?, estado = ?
		WHERE id = ?`,
		fecha, obraID, descripcion, precio, unidad, unidades, estado, id)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// Obtener el registro actualizado de la base de datos
	var updatedMaterialDB models.MaterialDB
	err = h.db.QueryRow(`
		SELECT m.id, m.fecha, m.obra_id, m.descripcion, m.precio, m.unidad, m.unidades, m.estado, o.nombre as obra_nombre
		FROM materiales m
		LEFT JOIN obras o ON m.obra_id = o.id
		WHERE m.id = ?
	`, id).Scan(
		&updatedMaterialDB.ID,
		&updatedMaterialDB.Fecha,
		&updatedMaterialDB.ObraID,
		&updatedMaterialDB.Descripcion,
		&updatedMaterialDB.Precio,
		&updatedMaterialDB.Unidad,
		&updatedMaterialDB.Unidades,
		&updatedMaterialDB.Estado,
		&updatedMaterialDB.ObraNombre,
	)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	h.jsonResponse(w, http.StatusOK, updatedMaterialDB.ToMaterial())
}

func (h *MaterialHandler) DeleteMaterial(w http.ResponseWriter, r *http.Request, id int) {
	_, err := h.db.Exec("DELETE FROM materiales WHERE id = ?", id)
	if err != nil {
		h.jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	h.jsonResponse(w, http.StatusOK, map[string]string{"message": "Material eliminado"})
}