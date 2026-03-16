package main

import (
	"encoding/json"
	"syscall/js"

	"github.com/LeGoatest/Pwa-idle-game/internal/game"
)

var state = game.NewDefaultState()

func getState(this js.Value, args []js.Value) any {
	out, _ := json.Marshal(state)
	return string(out)
}

func tick(this js.Value, args []js.Value) any {
	if len(args) > 0 {
		deltaMs := int64(args[0].Int())
		game.Tick(state, deltaMs)
	}
	return nil
}

func dispatch(this js.Value, args []js.Value) any {
	return nil
}

func main() {
	js.Global().Set("gameGetState", js.FuncOf(getState))
	js.Global().Set("gameTick", js.FuncOf(tick))
	js.Global().Set("gameDispatch", js.FuncOf(dispatch))
	select {}
}
