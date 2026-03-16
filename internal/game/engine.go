package game

func ProcessActivity(state *GameState, contentState ContentState, deltaMS int64, nowMS int64) bool {
	if state.Activity.Kind == "node" {
		return ProcessNode(state, contentState, deltaMS, nowMS)
	}

	if state.Activity.Kind == "combat" {
		return ProcessCombat(state, contentState, deltaMS, nowMS)
	}

	return false
}

func Tick(state *GameState, contentState ContentState, deltaMS int64, nowMS int64) bool {
	if deltaMS <= 0 {
		return false
	}

	changed := ProcessActivity(state, contentState, deltaMS, nowMS)
	state.UpdatedAt = nowMS
	return changed
}

func ApplyOfflineProgress(state *GameState, contentState ContentState, elapsedMS int64, nowMS int64) bool {
	if elapsedMS <= 0 {
		return false
	}

	if elapsedMS > MaxOfflineMS {
		elapsedMS = MaxOfflineMS
	}

	changed := Tick(state, contentState, elapsedMS, nowMS)
	state.UpdatedAt = nowMS
	return changed
}
