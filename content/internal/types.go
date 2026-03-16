package content

type Item struct {
	ID        string         `json:"id"`
	Name      string         `json:"name"`
	Type      string         `json:"type"`
	Stackable bool           `json:"stackable"`
	MaxStack  int            `json:"maxStack,omitempty"`
	Value     int            `json:"value"`
	EquipSlot string         `json:"equipSlot,omitempty"`
	Icon      string         `json:"icon"`
	Tags      []string       `json:"tags"`
	Stats     map[string]int `json:"stats,omitempty"`
	Effect    ItemEffect     `json:"effect,omitempty"`
}

type ItemEffect struct {
	Type  string `json:"type"`
	Value int    `json:"value"`
}

type SkillsIndex struct {
	Skills []string `json:"skills"`
}

type ZoneIndexEntry struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	LevelRequired int    `json:"levelRequired"`
}

type ZonesIndex struct {
	Zones []ZoneIndexEntry `json:"zones"`
}

type ShopIndex struct {
	Items []string `json:"items"`
}

type Zone struct {
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	Monsters []string `json:"monsters"`
}

type LootGold struct {
	Min int `json:"min"`
	Max int `json:"max"`
}

type LootDrop struct {
	Item   string  `json:"item"`
	Chance float64 `json:"chance"`
	Min    int     `json:"min"`
	Max    int     `json:"max"`
}

type MonsterLoot struct {
	Gold  LootGold   `json:"gold"`
	Drops []LootDrop `json:"drops"`
}

type Monster struct {
	ID         string      `json:"id"`
	Name       string      `json:"name"`
	Level      int         `json:"level"`
	HP         int         `json:"hp"`
	Attack     int         `json:"attack"`
	DurationMS int         `json:"durationMs"`
	XP         int         `json:"xp"`
	Loot       MonsterLoot `json:"loot"`
}

type SkillYield struct {
	Item   string `json:"item"`
	Amount int    `json:"amount"`
}

type SkillNode struct {
	ID            string     `json:"id"`
	Name          string     `json:"name"`
	LevelRequired int        `json:"levelRequired"`
	XP            float64    `json:"xp"`
	DurationMS    int        `json:"durationMs"`
	Yield         SkillYield `json:"yield"`
}

type Skill struct {
	ID    string      `json:"id"`
	Name  string      `json:"name"`
	Icon  string      `json:"icon"`
	Nodes []SkillNode `json:"nodes"`
}

type ShopItem struct {
	ID string `json:"id"`
}

type Registry struct {
	Items      map[string]Item
	ItemsList  []Item

	Skills     map[string]Skill
	SkillsList []Skill

	Zones      map[string]Zone
	ZonesList  []Zone

	Monsters     map[string]Monster
	MonstersList []Monster

	ShopItems     map[string]ShopItem
	ShopItemsList []ShopItem

	SkillsIndex SkillsIndex
	ZonesIndex  ZonesIndex
	ShopIndex   ShopIndex
}
