package game

func Tick(state *GameState, deltaMs int64) {
	state.Activity.Progress += float64(deltaMs)
	state.UpdatedAt += deltaMs
}
