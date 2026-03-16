package main

import (
	"encoding/json"
	"syscall/js"

	"github.com/LeGoatest/Pwa-idle-game/internal/content"
)

var runtime = NewRuntime()

func nowMS() int64 {
	return int64(js.Global().Get("Date").New().Call("getTime").Int())
}

func ok(data map[string]any) js.Value {
	obj := js.Global().Get("Object").New()
	obj.Set("ok", true)

	for k, v := range data {
		obj.Set(k, js.ValueOf(v))
	}

	return obj
}

func fail(message string) js.Value {
	obj := js.Global().Get("Object").New()
	obj.Set("ok", false)
	obj.Set("error", message)
	return obj
}

func parseRegistry(input string) (*content.Registry, error) {
	var reg content.Registry
	if err := json.Unmarshal([]byte(input), &reg); err != nil {
		return nil, err
	}

	if reg.Items == nil {
		reg.Items = map[string]content.Item{}
	}
	if reg.Skills == nil {
		reg.Skills = map[string]content.Skill{}
	}
	if reg.Zones == nil {
		reg.Zones = map[string]content.Zone{}
	}
	if reg.Monsters == nil {
		reg.Monsters = map[string]content.Monster{}
	}
	if reg.ShopItems == nil {
		reg.ShopItems = map[string]content.ShopItem{}
	}

	return &reg, nil
}

func gameInit(this js.Value, args []js.Value) any {
	if len(args) < 1 {
		return fail("missing registry json")
	}

	reg, err := parseRegistry(args[0].String())
	if err != nil {
		return fail(err.Error())
	}

	saveJSON := ""
	if len(args) > 1 && args[1].Type() != js.TypeUndefined && args[1].Type() != js.TypeNull {
		saveJSON = args[1].String()
	}

	if err := runtime.Init(reg, saveJSON, nowMS()); err != nil {
		return fail(err.Error())
	}

	stateJSON, err := runtime.StateJSON()
	if err != nil {
		return fail(err.Error())
	}

	return ok(map[string]any{
		"state": stateJSON,
	})
}

func gameTick(this js.Value, args []js.Value) any {
	if len(args) < 1 {
		return fail("missing delta")
	}

	changed, err := runtime.Tick(int64(args[0].Int()), nowMS())
	if err != nil {
		return fail(err.Error())
	}

	stateJSON, err := runtime.StateJSON()
	if err != nil {
		return fail(err.Error())
	}

	return ok(map[string]any{
		"changed": changed,
		"state":   stateJSON,
	})
}

func gameDispatch(this js.Value, args []js.Value) any {
	if len(args) < 1 {
		return fail("missing action json")
	}

	if err := runtime.Dispatch(args[0].String(), nowMS()); err != nil {
		return fail(err.Error())
	}

	stateJSON, err := runtime.StateJSON()
	if err != nil {
		return fail(err.Error())
	}

	return ok(map[string]any{
		"state": stateJSON,
	})
}

func gameExportSave(this js.Value, args []js.Value) any {
	saveJSON, err := runtime.ExportSave()
	if err != nil {
		return fail(err.Error())
	}

	return ok(map[string]any{
		"save": saveJSON,
	})
}

func gameGetState(this js.Value, args []js.Value) any {
	stateJSON, err := runtime.StateJSON()
	if err != nil {
		return fail(err.Error())
	}

	return ok(map[string]any{
		"state": stateJSON,
	})
}

func main() {
	js.Global().Set("gameInit", js.FuncOf(gameInit))
	js.Global().Set("gameTick", js.FuncOf(gameTick))
	js.Global().Set("gameDispatch", js.FuncOf(gameDispatch))
	js.Global().Set("gameExportSave", js.FuncOf(gameExportSave))
	js.Global().Set("gameGetState", js.FuncOf(gameGetState))
	select {}
}
