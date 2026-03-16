package game

func ApplyOfflineProgress(state *GameState, elapsedMs int64) {
	if elapsedMs <= 0 {
		return
	}

	const maxOfflineMs int64 = 8 * 60 * 60 * 1000
	if elapsedMs > maxOfflineMs {
		elapsedMs = maxOfflineMs
	}

	Tick(state, elapsedMs)
}
