package game

func ResetState(nowMS int64) *GameState {
	return NewDefaultState(nowMS)
}
