package main

import (
	"encoding/json"
	"syscall/js"

	"github.com/LeGoatest/Pwa-idle-game/internal/content"
)

var runtime = newRuntime()

func loadRegistryFromJSON(contentJSON string) (*content.Registry, error) {
	var reg content.Registry
	if err := json.Unmarshal([]byte(contentJSON), &reg); err != nil {
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

func nowMS() int64 {
	return js.Global().Get("Date").New().Call("getTime").Int64()
}

func initRuntime(this js.Value, args []js.Value) any {
	if len(args) < 1 {
		return jsError("init requires content JSON")
	}

	contentJSON := args[0].String()
	saveJSON := ""
	if len(args) > 1 && args[1].Type() != js.TypeUndefined && args[1].Type() != js.TypeNull {
		saveJSON = args[1].String()
	}

	if err := runtime.init(contentJSON, saveJSON, nowMS()); err != nil {
		return jsError(err.Error())
	}

	return jsOK(map[string]any{
		"state": mustStateJSON(),
	})
}

func tickRuntime(this js.Value, args []js.Value) any {
	if len(args) < 1 {
		return jsError("tick requires deltaMS")
	}

	deltaMS := int64(args[0].Int())
	changed, err := runtime.tick(deltaMS, nowMS())
	if err != nil {
		return jsError(err.Error())
	}

	return jsOK(map[string]any{
		"changed": changed,
		"state":   mustStateJSON(),
	})
}

func dispatchRuntime(this js.Value, args []js.Value) any {
	if len(args) < 1 {
		return jsError("dispatch requires action JSON")
	}

	if err := runtime.dispatch(args[0].String(), nowMS()); err != nil {
		return jsError(err.Error())
	}

	return jsOK(map[string]any{
		"state": mustStateJSON(),
	})
}

func exportSaveRuntime(this js.Value, args []js.Value) any {
	saveJSON, err := runtime.exportSave()
	if err != nil {
		return jsError(err.Error())
	}

	return jsOK(map[string]any{
		"save": saveJSON,
	})
}

func getStateRuntime(this js.Value, args []js.Value) any {
	return jsOK(map[string]any{
		"state": mustStateJSON(),
	})
}

func mustStateJSON() string {
	s, err := runtime.getStateJSON()
	if err != nil {
		return "{}"
	}
	return s
}

func main() {
	js.Global().Set("gameInit", js.FuncOf(initRuntime))
	js.Global().Set("gameTick", js.FuncOf(tickRuntime))
	js.Global().Set("gameDispatch", js.FuncOf(dispatchRuntime))
	js.Global().Set("gameExportSave", js.FuncOf(exportSaveRuntime))
	js.Global().Set("gameGetState", js.FuncOf(getStateRuntime))
	select {}
}
