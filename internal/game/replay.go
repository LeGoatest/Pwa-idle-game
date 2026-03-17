package game

import "github.com/LeGoatest/Pwa-idle-game/internal/content"

type ReplayEvent struct {
	Time int64  `json:"t"`
	Type string `json:"type"`
	ID   string `json:"id"`
}

type ReplayLog struct {
	Events []ReplayEvent `json:"events"`
}

func RecordAction(log *ReplayLog, nowMS int64, action Action) {
	log.Events = append(log.Events, ReplayEvent{
		Time: nowMS,
		Type: action.Type,
		ID:   action.ID,
	})
}

func RunReplay(state *GameState, reg *content.Registry, replay ReplayLog) error {
	var currentTime int64

	for _, event := range replay.Events {
		delta := event.Time - currentTime
		if delta > 0 {
			contentState := ResolveContentState(state, reg)
			Tick(state, contentState, delta, event.Time)
		}

		if err := Dispatch(state, reg, Action{
			Type: event.Type,
			ID:   event.ID,
		}, event.Time); err != nil {
			return err
		}

		currentTime = event.Time
	}

	return nil
}
