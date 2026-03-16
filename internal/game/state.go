package game

type EquipmentState struct {
	Weapon  string `json:"weapon"`
	Head    string `json:"head"`
	Chest   string `json:"chest"`
	Offhand string `json:"offhand"`
	Feet    string `json:"feet"`
}

type UIState struct {
	Tab            string `json:"tab"`
	CurrentZoneID  string `json:"currentZoneId"`
	CurrentMonsterID string `json:"currentMonsterId"`
	CurrentSkillID string `json:"currentSkillId"`
	CombatMode     string `json:"combatMode"`
	SkillsMode     string `json:"skillsMode"`
}

type ActivityState struct {
	Kind      string  `json:"kind"`
	ZoneID    string  `json:"zoneId"`
	MonsterID string  `json:"monsterId"`
	SkillID   string  `json:"skillId"`
	NodeID    string  `json:"nodeId"`
	Progress  float64 `json:"progress"`
}

type GameState struct {
	Version int `json:"version"`

	Gold  int `json:"gold"`
	Kills int `json:"kills"`

	Attack  int `json:"attack"`
	Defense int `json:"defense"`
	HP      int `json:"hp"`
	MaxHP   int `json:"maxHp"`

	EnemyHP    int `json:"enemyHp"`
	EnemyMaxHP int `json:"enemyMaxHp"`

	CombatXP int `json:"combatXp"`
	WoodXP   int `json:"woodXp"`
	MineXP   int `json:"mineXp"`

	CombatLevel int `json:"combatLevel"`
	WoodLevel   int `json:"woodLevel"`
	MineLevel   int `json:"mineLevel"`

	Inventory map[string]int `json:"inventory"`
	Equipment EquipmentState `json:"equipment"`
	UI        UIState        `json:"ui"`
	Activity  ActivityState  `json:"activity"`

	UpdatedAt int64 `json:"updatedAt"`
}

func NewDefaultState() *GameState {
	return &GameState{
		Version: 1,
		Attack:  2,
		Defense: 1,
		HP:      20,
		MaxHP:   20,
		EnemyHP: 12,
		EnemyMaxHP: 12,
		CombatLevel: 1,
		WoodLevel:   1,
		MineLevel:   1,
		Inventory:   map[string]int{},
		UI: UIState{
			Tab:        "combat",
			CombatMode: "zone",
			SkillsMode: "list",
		},
		Activity: ActivityState{
			Kind: "none",
		},
	}
}
