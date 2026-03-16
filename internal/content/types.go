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
	Effect    *ItemEffect    `json:"effect,omitempty"`
}

func (x Item) GetID() string { return x.ID }

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
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	LevelRequired int      `json:"levelRequired,omitempty"`
	Monsters      []string `json:"monsters"`
}

func (x Zone) GetID() string { return x.ID }

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
	Gold  *LootGold  `json:"gold,omitempty"`
	Drops []LootDrop `json:"drops,omitempty"`
}

type Monster struct {
	ID         string       `json:"id"`
	Name       string       `json:"name"`
	Level      int          `json:"level"`
	HP         int          `json:"hp"`
	Attack     int          `json:"attack"`
	DurationMS int          `json:"durationMs,omitempty"`
	XP         int          `json:"xp,omitempty"`
	Boss       bool         `json:"boss,omitempty"`
	DropTable  string       `json:"dropTable,omitempty"`
	Loot       *MonsterLoot `json:"loot,omitempty"`
}

func (x Monster) GetID() string { return x.ID }

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

func (x Skill) GetID() string { return x.ID }

type ShopItemEffect struct {
	Type    string `json:"type"`
	Stat    string `json:"stat,omitempty"`
	Value   int    `json:"value,omitempty"`
	ItemKey string `json:"itemKey,omitempty"`
	Amount  int    `json:"amount,omitempty"`
}

type ShopItem struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Description string          `json:"description,omitempty"`
	Price       int             `json:"price"`
	Effect      *ShopItemEffect `json:"effect,omitempty"`
}

func (x ShopItem) GetID() string { return x.ID }

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

type Registry struct {
	Items          map[string]Item
	ItemsList      []Item
	Skills         map[string]Skill
	SkillsList     []Skill
	Zones          map[string]Zone
	ZonesList      []Zone
	Monsters       map[string]Monster
	MonstersList   []Monster
	ShopItems      map[string]ShopItem
	ShopItemsList  []ShopItem
	DropTables     map[string]DropTable
	DropTablesList []DropTable

	SkillsIndex SkillsIndex
	ZonesIndex  ZonesIndex
	ShopIndex   ShopIndex
}
