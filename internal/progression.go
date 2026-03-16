package game

func ProcessProgression(state *GameState) {
	state.CombatLevel = 1 + (state.CombatXP / 100)
	state.WoodLevel = 1 + (state.WoodXP / 100)
	state.MineLevel = 1 + (state.MineXP / 100)

	state.Attack = 2 + (state.CombatLevel - 1)
	state.Defense = 1 + ((state.CombatLevel - 1) / 2)
}
