package game

func Tick(state *GameState, contentState ContentState, deltaMS int64, nowMS int64) bool {
	if state == nil || deltaMS <= 0 {
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

func ApplyOfflineProgress(state *GameState, contentState ContentState, elapsedMS int64, nowMS int64) bool {
	if state == nil {
		return false
	}

	elapsedMS = ClampOffline(elapsedMS)
	if elapsedMS <= 0 {
		state.UpdatedAt = nowMS
		return false
	}

	return Tick(state, contentState, elapsedMS, nowMS)
}
