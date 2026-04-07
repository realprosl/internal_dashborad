package models

type Planing struct {
	ID             int    `db:"id" json:"id"`
	Fecha          string `db:"fecha" json:"fecha"`
	OperarioID     int    `db:"operario_id" json:"operario_id"`
	ObraID         int    `db:"obra_id" json:"obra_id"`
	OperarioNombre string `db:"operario_nombre" json:"operario_nombre,omitempty"`
	ObraNombre     string `db:"obra_nombre" json:"obra_nombre,omitempty"`
}
