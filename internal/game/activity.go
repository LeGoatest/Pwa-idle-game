package game

func StartActivity(state *GameState, payload ActivityState, nowMS int64) {
	state.Activity = ActivityState{
		Kind:            payload.Kind,
		ZoneID:          payload.ZoneID,
		MonsterID:       payload.MonsterID,
		SkillID:         payload.SkillID,
		NodeID:          payload.NodeID,
		StartedAt:       nowMS,
		LastProcessedAt: nowMS,
		Progress:        0,
	}
}

func StopActivity(state *GameState) {
	state.Activity = ActivityState{
		Kind:     "none",
		Progress: 0,
	}
}
