package game

func ProcessActivity(state *GameState, deltaMs int64) {
	switch state.Activity.Kind {
	case "combat":
		ProcessCombat(state, deltaMs)
	case "woodcutting":
		state.Activity.Progress += float64(deltaMs)
	case "mining":
		state.Activity.Progress += float64(deltaMs)
	default:
		return
	}
}
