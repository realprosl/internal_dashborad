package models

type Operario struct {
	ID          int     `db:"id" json:"id"`
	Nombre      string  `db:"nombre" json:"nombre"`
	GastoDiario float64 `db:"gasto_diario" json:"gasto_diario"`
}
