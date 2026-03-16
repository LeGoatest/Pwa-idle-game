package main

import (
	"encoding/json"
	"errors"
	"syscall/js"

	"github.com/LeGoatest/Pwa-idle-game/internal/content"
	"github.com/LeGoatest/Pwa-idle-game/internal/game"
)

type wasmRuntime struct {
	registry      *content.Registry
	state         *game.GameState
	contentState  game.ContentState
	lastTickAtMS  int64
}

type wasmAction struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

func newRuntime() *wasmRuntime {
	return &wasmRuntime{}
}

func (rt *wasmRuntime) init(contentJSON string, saveJSON string, nowMS int64) error {
	reg, err := loadRegistryFromJSON(contentJSON)
	if err != nil {
		return err
	}

	var state *game.GameState
	if saveJSON != "" && saveJSON != "null" {
		state, err = game.ImportSave([]byte(saveJSON))
		if err != nil {
			return err
		}
	} else {
		state = game.NewDefaultState(nowMS)
	}

	rt.registry = reg
	rt.state = state
	rt.lastTickAtMS = nowMS

	rt.hydrateFromState()

	if state.UpdatedAt > 0 && nowMS > state.UpdatedAt {
		elapsed := nowMS - state.UpdatedAt
		game.ApplyOfflineProgress(rt.state, rt.contentState, elapsed, nowMS)
	}

	if rt.state.UI.CurrentZoneID == "" && len(rt.registry.ZonesIndex.Zones) > 0 {
		firstZone := rt.registry.ZonesIndex.Zones[0]
		rt.state.UI.CurrentZoneID = firstZone.ID
	}

	rt.hydrateFromState()

	return nil
}

func (rt *wasmRuntime) ensureReady() error {
	if rt.registry == nil {
		return errors.New("registry not initialized")
	}
	if rt.state == nil {
		return errors.New("state not initialized")
	}
	return nil
}

func (rt *wasmRuntime) hydrateFromState() {
	if rt.registry == nil || rt.state == nil {
		return
	}

	rt.contentState.ActiveMonster = nil
	rt.contentState.ActiveNode = nil
	rt.contentState.ActiveSkill = nil

	if rt.state.Activity.Kind == "combat" && rt.state.Activity.MonsterID != "" {
		if monster, ok := rt.registry.Monsters[rt.state.Activity.MonsterID]; ok {
			m := monster
			rt.contentState.ActiveMonster = &m
		}
	}

	skillID := rt.state.Activity.SkillID
	if skillID == "" {
		skillID = rt.state.UI.CurrentSkillID
	}

	if skillID != "" {
		if skill, ok := rt.registry.Skills[skillID]; ok {
			s := skill
			rt.contentState.ActiveSkill = &s

			nodeID := rt.state.Activity.NodeID
			if nodeID != "" {
				for i := range s.Nodes {
					if s.Nodes[i].ID == nodeID {
						rt.contentState.ActiveNode = &s.Nodes[i]
						break
					}
				}
			}
		}
	}

	if rt.state.UI.CurrentMonsterID != "" && rt.contentState.ActiveMonster == nil {
		if monster, ok := rt.registry.Monsters[rt.state.UI.CurrentMonsterID]; ok {
			m := monster
			rt.contentState.ActiveMonster = &m
		}
	}
}

func (rt *wasmRuntime) tick(deltaMS int64, nowMS int64) (bool, error) {
	if err := rt.ensureReady(); err != nil {
		return false, err
	}

	rt.hydrateFromState()

	changed := game.Tick(rt.state, rt.contentState, deltaMS, nowMS)
	rt.lastTickAtMS = nowMS

	return changed, nil
}

func (rt *wasmRuntime) dispatch(actionJSON string, nowMS int64) error {
	if err := rt.ensureReady(); err != nil {
		return err
	}

	var action wasmAction
	if err := json.Unmarshal([]byte(actionJSON), &action); err != nil {
		return err
	}

	if err := game.Dispatch(rt.state, game.Action{
		Type: action.Type,
		ID:   action.ID,
	}, nowMS); err != nil {
		return err
	}

	rt.hydrateFromState()

	if rt.contentState.ActiveMonster != nil && rt.state.Activity.Kind == "combat" {
		rt.state.EnemyMaxHP = rt.contentState.ActiveMonster.HP
		rt.state.EnemyHP = rt.contentState.ActiveMonster.HP
	}

	return nil
}

func (rt *wasmRuntime) exportSave() (string, error) {
	if err := rt.ensureReady(); err != nil {
		return "", err
	}

	data, err := game.ExportSave(rt.state)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func (rt *wasmRuntime) getStateJSON() (string, error) {
	if err := rt.ensureReady(); err != nil {
		return "", err
	}

	out, err := json.Marshal(rt.state)
	if err != nil {
		return "", err
	}

	return string(out), nil
}

func jsError(msg string) js.Value {
	obj := js.Global().Get("Object").New()
	obj.Set("ok", false)
	obj.Set("error", msg)
	return obj
}

func jsOK(data map[string]any) js.Value {
	obj := js.Global().Get("Object").New()
	obj.Set("ok", true)
	for k, v := range data {
		obj.Set(k, js.ValueOf(v))
	}
	return obj
}
