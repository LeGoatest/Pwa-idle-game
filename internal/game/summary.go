package game

type StateSummary struct {
	Gold        int            `json:"gold"`
	Kills       int            `json:"kills"`
	Attack      int            `json:"attack"`
	Defense     int            `json:"defense"`
	HP          int            `json:"hp"`
	CombatXP    float64        `json:"combatXp"`
	WoodXP      float64        `json:"woodXp"`
	MineXP      float64        `json:"mineXp"`
	CombatLevel int            `json:"combatLevel"`
	WoodLevel   int            `json:"woodLevel"`
	MineLevel   int            `json:"mineLevel"`
	EnemyHP     int            `json:"enemyHp"`
	EnemyMaxHP  int            `json:"enemyMaxHp"`
	Activity    ActivityState  `json:"activity"`
	Inventory   map[string]int `json:"inventory"`
	UpdatedAt   int64          `json:"updatedAt"`
}

func BuildSummary(state *GameState) StateSummary {
	if state == nil {
		return StateSummary{}
	}

	inv := make(map[string]int, len(state.Inventory))
	for k, v := range state.Inventory {
		inv[k] = v
	}

	return StateSummary{
		Gold:        state.Gold,
		Kills:       state.Kills,
		Attack:      state.Attack,
		Defense:     state.Defense,
		HP:          state.HP,
		CombatXP:    state.CombatXP,
		WoodXP:      state.WoodXP,
		MineXP:      state.MineXP,
		CombatLevel: state.CombatLevel,
		WoodLevel:   state.WoodLevel,
		MineLevel:   state.MineLevel,
		EnemyHP:     state.EnemyHP,
		EnemyMaxHP:  state.EnemyMaxHP,
		Activity:    state.Activity,
		Inventory:   inv,
		UpdatedAt:   state.UpdatedAt,
	}
}
