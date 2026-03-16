package game

const (
	TickMS         int64 = 100
	MaxOfflineMS   int64 = 8 * 60 * 60 * 1000
	SaveDebounceMS int64 = 5000
)

type EquipmentState struct {
	Weapon  string `json:"weapon"`
	Head    string `json:"head"`
	Chest   string `json:"chest"`
	Offhand string `json:"offhand"`
	Feet    string `json:"feet"`
}

type UIState struct {
	Tab              string `json:"tab"`
	CurrentZoneID    string `json:"currentZoneId"`
	CurrentMonsterID string `json:"currentMonsterId"`
	CurrentSkillID   string `json:"currentSkillId"`
	CombatMode       string `json:"combatMode"`
	SkillsMode       string `json:"skillsMode"`
}

type ActivityState struct {
	Kind            string  `json:"kind"`
	ZoneID          string  `json:"zoneId,omitempty"`
	MonsterID       string  `json:"monsterId,omitempty"`
	SkillID         string  `json:"skillId,omitempty"`
	NodeID          string  `json:"nodeId,omitempty"`
	StartedAt       int64   `json:"startedAt,omitempty"`
	LastProcessedAt int64   `json:"lastProcessedAt,omitempty"`
	Progress        float64 `json:"progress"`
}

type MetaState struct {
	InstallID      string `json:"installId"`
	InstalledAt    int64  `json:"installedAt"`
	LaunchCount    int    `json:"launchCount"`
	LastLaunchedAt int64  `json:"lastLaunchedAt"`
}

type GameState struct {
	Version int `json:"version"`

	Gold  int `json:"gold"`
	Kills int `json:"kills"`

	Attack  int `json:"attack"`
	Defense int `json:"defense"`
	HP      int `json:"hp"`

	WoodXP   float64 `json:"woodXp"`
	MineXP   float64 `json:"mineXp"`
	CombatXP float64 `json:"combatXp"`

	WoodLevel   int `json:"woodLevel"`
	MineLevel   int `json:"mineLevel"`
	CombatLevel int `json:"combatLevel"`

	EnemyHP    int `json:"enemyHp"`
	EnemyMaxHP int `json:"enemyMaxHp"`

	Inventory map[string]int `json:"inventory"`
	Equipment EquipmentState `json:"equipment"`
	UI        UIState        `json:"ui"`
	Activity  ActivityState  `json:"activity"`

	UpdatedAt int64 `json:"updatedAt"`
}

func NewDefaultState(nowMS int64) *GameState {
	return &GameState{
		Version: 8,

		Gold:  0,
		Kills: 0,

		Attack:  2,
		Defense: 1,
		HP:      20,

		WoodXP:   0,
		MineXP:   0,
		CombatXP: 0,

		WoodLevel:   1,
		MineLevel:   1,
		CombatLevel: 1,

		EnemyHP:    12,
		EnemyMaxHP: 12,

		Inventory: map[string]int{},

		Equipment: EquipmentState{},

		UI: UIState{
			Tab:              "combat",
			CurrentZoneID:    "",
			CurrentMonsterID: "",
			CurrentSkillID:   "",
			CombatMode:       "zone",
			SkillsMode:       "list",
		},

		Activity: ActivityState{
			Kind:     "none",
			Progress: 0,
		},

		UpdatedAt: nowMS,
	}
}

func NewDefaultMeta(nowMS int64, installID string) *MetaState {
	return &MetaState{
		InstallID:      installID,
		InstalledAt:    nowMS,
		LaunchCount:    0,
		LastLaunchedAt: 0,
	}
}
