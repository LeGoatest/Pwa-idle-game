package content

type DropTableEntry struct {
	Item   string  `json:"item"`
	Chance float64 `json:"chance"`
	Min    int     `json:"min"`
	Max    int     `json:"max"`
}

type DropTable struct {
	ID    string           `json:"id"`
	Drops []DropTableEntry `json:"drops"`
}

func (x DropTable) GetID() string { return x.ID }
