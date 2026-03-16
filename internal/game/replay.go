package game

type ReplayEvent struct {
	Time int64  `json:"t"`
	Type string `json:"type"`
	ID   string `json:"id"`
}

type ReplayLog struct {
	Events []ReplayEvent `json:"events"`
}

func RecordAction(log *ReplayLog, now int64, action Action) {
	log.Events = append(log.Events, ReplayEvent{
		Time: now,
		Type: action.Type,
		ID:   action.ID,
	})
}

func RunReplay(state *GameState, replay ReplayLog) error {
	var currentTime int64

	for _, event := range replay.Events {
		delta := event.Time - currentTime
		if delta > 0 {
			Tick(state, delta)
		}

		if err := Dispatch(state, Action{
			Type: event.Type,
			ID:   event.ID,
		}); err != nil {
			return err
		}

		currentTime = event.Time
	}

	return nil
}
