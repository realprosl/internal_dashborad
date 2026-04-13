package models

import (
	"database/sql"
	"encoding/json"
)

type Material struct {
	ID          int     `db:"id" json:"id"`
	Fecha       string  `db:"fecha" json:"fecha"`
	ObraID      int     `db:"obra_id" json:"obra_id"`
	Descripcion string  `db:"descripcion" json:"descripcion"`
	Precio      float64 `db:"precio" json:"precio"`
	Unidad      string  `db:"unidad" json:"unidad"`
	Unidades    float64 `db:"unidades" json:"unidades"`
	Estado      string  `db:"estado" json:"estado"`
	ObraNombre  string  `db:"obra_nombre" json:"obra_nombre,omitempty"`
}

// MaterialDB is the database representation with sql.NullString
type MaterialDB struct {
	ID          int            `db:"id"`
	Fecha       string         `db:"fecha"`
	ObraID      int            `db:"obra_id"`
	Descripcion string         `db:"descripcion"`
	Precio      float64        `db:"precio"`
	Unidad      string         `db:"unidad"`
	Unidades    float64        `db:"unidades"`
	Estado      string         `db:"estado"`
	ObraNombre  sql.NullString `db:"obra_nombre"`
}

// ToMaterial converts MaterialDB to Material for JSON response
func (mdb *MaterialDB) ToMaterial() Material {
	return Material{
		ID:          mdb.ID,
		Fecha:       mdb.Fecha,
		ObraID:      mdb.ObraID,
		Descripcion: mdb.Descripcion,
		Precio:      mdb.Precio,
		Unidad:      mdb.Unidad,
		Unidades:    mdb.Unidades,
		Estado:      mdb.Estado,
		ObraNombre:  mdb.ObraNombre.String,
	}
}

// MarshalJSON implements custom JSON marshaling
func (m *Material) MarshalJSON() ([]byte, error) {
	type Alias Material
	return json.Marshal(&struct {
		*Alias
	}{
		Alias: (*Alias)(m),
	})
}