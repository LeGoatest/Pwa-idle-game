package main

import (
	"encoding/json"
	"errors"

	"github.com/LeGoatest/Pwa-idle-game/internal/content"
	"github.com/LeGoatest/Pwa-idle-game/internal/game"
)

type Runtime struct {
	Registry     *content.Registry
	State        *game.GameState
	ContentState game.ContentState
}

type ActionPayload struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

func NewRuntime() *Runtime {
	return &Runtime{}
}

func (rt *Runtime) Init(reg *content.Registry, saveJSON string, nowMS int64) error {
	if reg == nil {
		return errors.New("registry is nil")
	}

	rt.Registry = reg

	state, err := loadState(saveJSON, nowMS)
	if err != nil {
		return err
	}
	rt.State = state

	if rt.State.UI.CurrentZoneID == "" && len(reg.ZonesIndex.Zones) > 0 {
		rt.State.UI.CurrentZoneID = reg.ZonesIndex.Zones[0].ID
	}

	if rt.State.UI.CurrentSkillID == "" && len(reg.SkillsIndex.Skills) > 0 {
		rt.State.UI.CurrentSkillID = reg.SkillsIndex.Skills[0]
	}

	if rt.State.UI.CurrentZoneID != "" && rt.State.UI.CurrentMonsterID == "" {
		if zone, ok := reg.Zones[rt.State.UI.CurrentZoneID]; ok && len(zone.Monsters) > 0 {
			rt.State.UI.CurrentMonsterID = zone.Monsters[0]
		}
	}

	rt.ContentState = game.ResolveContentState(rt.State, rt.Registry)
	applyOffline(rt.State, rt.ContentState, nowMS)
	rt.ContentState = game.ResolveContentState(rt.State, rt.Registry)

	return nil
}

func (rt *Runtime) Tick(deltaMS int64, nowMS int64) (bool, error) {
	if rt.State == nil {
		return false, errors.New("runtime not initialized")
	}

	rt.ContentState = game.ResolveContentState(rt.State, rt.Registry)
	changed := game.Tick(rt.State, rt.ContentState, deltaMS, nowMS)
	rt.ContentState = game.ResolveContentState(rt.State, rt.Registry)

	return changed, nil
}

func (rt *Runtime) Dispatch(actionJSON string, nowMS int64) error {
	if rt.State == nil {
		return errors.New("runtime not initialized")
	}

	var action ActionPayload
	if err := json.Unmarshal([]byte(actionJSON), &action); err != nil {
		return err
	}

	if err := game.Dispatch(rt.State, rt.Registry, game.Action{
		Type: action.Type,
		ID:   action.ID,
	}, nowMS); err != nil {
		return err
	}

	rt.ContentState = game.ResolveContentState(rt.State, rt.Registry)

	if rt.ContentState.ActiveMonster != nil && rt.State.Activity.Kind == "combat" {
		rt.State.EnemyHP = rt.ContentState.ActiveMonster.HP
		rt.State.EnemyMaxHP = rt.ContentState.ActiveMonster.HP
	}

	return nil
}

func (rt *Runtime) ExportSave() (string, error) {
	if rt.State == nil {
		return "", errors.New("runtime not initialized")
	}

	data, err := game.ExportSave(rt.State)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func (rt *Runtime) StateJSON() (string, error) {
	if rt.State == nil {
		return "", errors.New("runtime not initialized")
	}

	data, err := json.Marshal(rt.State)
	if err != nil {
		return "", err
	}

	return string(data), nil
}
