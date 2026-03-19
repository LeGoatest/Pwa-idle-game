package game

import "math"

func XPForLevel(level int) float64 {
	return math.Floor(20 * math.Pow(float64(level), 1.4))
}

func GainXP(state *GameState, skill string, amount float64) {
	if state == nil || amount <= 0 {
		return
	}

	var xp *float64
	var level *int
	onLevel := func() {}

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

	case "attack":
		xp = &state.AttackXP
		level = &state.AttackLevel
		onLevel = func() {
			state.Attack += 1
		}

	case "strength":
		xp = &state.StrengthXP
		level = &state.StrengthLevel
		onLevel = func() {
			state.Attack += 1
		}

	case "defense":
		xp = &state.DefenseXP
		level = &state.DefenseLevel
		onLevel = func() {
			state.Defense += 1
		}

	default:
		return
	}

	*xp += amount

	for *xp >= XPForLevel(*level) {
		*xp -= XPForLevel(*level)
		(*level)++
		onLevel()
	}

	syncCombatSummary(state)
}

func syncCombatSummary(state *GameState) {
	if state == nil {
		return
	}

	totalLevel := state.AttackLevel + state.StrengthLevel + state.DefenseLevel
	if totalLevel <= 0 {
		state.CombatLevel = 1
	} else {
		state.CombatLevel = int(math.Floor(float64(totalLevel) / 3.0))
		if state.CombatLevel < 1 {
			state.CombatLevel = 1
		}
	}

	state.CombatXP = displayedCombatModeXP(state)
}

func displayedCombatModeXP(state *GameState) float64 {
	if state == nil {
		return 0
	}

	switch state.UI.CombatMode {
	case "strength":
		return state.StrengthXP
	case "defense":
		return state.DefenseXP
	case "attack":
		return state.AttackXP
	default:
		return state.AttackXP
	}
}
