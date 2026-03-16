package game

import "encoding/json"

func ExportSave(state *GameState) ([]byte, error) {
	return json.Marshal(state)
}

func ImportSave(data []byte) (*GameState, error) {
	var state GameState
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, err
	}

	if state.Inventory == nil {
		state.Inventory = map[string]int{}
	}

	return &state, nil
}
