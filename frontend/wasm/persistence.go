package main

import "github.com/LeGoatest/Pwa-idle-game/internal/game"

func loadState(saveJSON string, nowMS int64) (*game.GameState, error) {
	if saveJSON == "" || saveJSON == "null" {
		return game.NewDefaultState(nowMS), nil
	}

	state, err := game.ImportSave([]byte(saveJSON))
	if err != nil {
		return nil, err
	}

	if state.UpdatedAt == 0 {
		state.UpdatedAt = nowMS
	}

	return state, nil
}

func applyOffline(state *game.GameState, contentState game.ContentState, nowMS int64) bool {
	if state == nil {
		return false
	}

	if state.UpdatedAt <= 0 || nowMS <= state.UpdatedAt {
		state.UpdatedAt = nowMS
		return false
	}

	elapsed := nowMS - state.UpdatedAt
	return game.ApplyOfflineProgress(state, contentState, elapsed, nowMS)
}
