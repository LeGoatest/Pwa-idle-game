package game

import "encoding/json"

func CloneState(state *GameState) *GameState {
	if state == nil {
		return nil
	}

	data, err := json.Marshal(state)
	if err != nil {
		return nil
	}

	var out GameState
	if err := json.Unmarshal(data, &out); err != nil {
		return nil
	}

	if out.Inventory == nil {
		out.Inventory = map[string]int{}
	}

	return &out
}

func CloneMeta(meta *MetaState) *MetaState {
	if meta == nil {
		return nil
	}

	data, err := json.Marshal(meta)
	if err != nil {
		return nil
	}

	var out MetaState
	if err := json.Unmarshal(data, &out); err != nil {
		return nil
	}

	return &out
}
