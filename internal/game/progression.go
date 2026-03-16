package game

import "math"

func XPForLevel(level int) float64 {
	return math.Floor(20 * math.Pow(float64(level), 1.4))
}

func GainXP(state *GameState, skill string, amount float64) {
	var xp *float64
	var level *int

	switch skill {
	case "wood":
		xp = &state.WoodXP
		level = &state.WoodLevel
	case "mine":
		xp = &state.MineXP
		level = &state.MineLevel
	case "combat":
		xp = &state.CombatXP
		level = &state.CombatLevel
	default:
		return
	}

	*xp += amount

	for *xp >= XPForLevel(*level) {
		*xp -= XPForLevel(*level)
		*level++

		if skill == "combat" {
			state.Attack += 1
		}
	}
}
