package game

func ProcessCombat(state *GameState, deltaMs int64) {
	if state.Activity.Kind != "combat" {
		return
	}

	if state.EnemyHP <= 0 {
		state.Kills++
		state.Gold += 5
		state.CombatXP += 5
		state.EnemyHP = state.EnemyMaxHP
		return
	}

	damage := int(deltaMs / 1000)
	if damage < 1 {
		damage = 1
	}

	state.EnemyHP -= damage
	if state.EnemyHP < 0 {
		state.EnemyHP = 0
	}
}
