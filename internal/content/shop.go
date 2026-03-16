package content

type ShopItemEffect struct {
	Type   string `json:"type"`
	Stat   string `json:"stat,omitempty"`
	Value  int    `json:"value,omitempty"`
	ItemKey string `json:"itemKey,omitempty"`
	Amount int    `json:"amount,omitempty"`
}

type ShopItem struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Description string          `json:"description,omitempty"`
	Price       int             `json:"price"`
	Effect      *ShopItemEffect `json:"effect,omitempty"`
}

func (x ShopItem) GetID() string { return x.ID }
