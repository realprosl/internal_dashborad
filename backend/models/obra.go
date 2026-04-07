package models

type Obra struct {
	ID            int     `db:"id" json:"id"`
	Nombre        string  `db:"nombre" json:"nombre"`
	ValorContrato float64 `db:"valor_contrato" json:"valor_contrato"`
	Estado        string  `db:"estado" json:"estado"`
}
