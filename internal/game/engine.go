package game

func Tick(state *GameState, contentState ContentState, deltaMS int64, nowMS int64) bool {
	if state == nil {
		return false
	}

	state.UpdatedAt = nowMS

	switch state.Activity.Kind {
	case "combat":
		return ProcessCombat(state, contentState, deltaMS, nowMS)

	case "node":
		return ProcessNode(state, contentState, deltaMS, nowMS)

	default:
		return false
	}
}
