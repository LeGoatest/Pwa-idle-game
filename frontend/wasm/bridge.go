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

	if saveJSON != "" && saveJSON != "null" {
		state, err := game.ImportSave([]byte(saveJSON))
		if err != nil {
			return err
		}
		rt.State = state
	} else {
		rt.State = game.NewDefaultState(nowMS)
	}

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

	rt.hydrate()

	if rt.State.UpdatedAt > 0 && nowMS > rt.State.UpdatedAt {
		elapsed := nowMS - rt.State.UpdatedAt
		game.ApplyOfflineProgress(rt.State, rt.ContentState, elapsed, nowMS)
	}

	rt.hydrate()
	return nil
}

func (rt *Runtime) hydrate() {
	rt.ContentState = game.ContentState{}

	if rt.Registry == nil || rt.State == nil {
		return
	}

	if rt.State.Activity.Kind == "combat" && rt.State.Activity.MonsterID != "" {
		if monster, ok := rt.Registry.Monsters[rt.State.Activity.MonsterID]; ok {
			m := monster
			rt.ContentState.ActiveMonster = &m
		}
	} else if rt.State.UI.CurrentMonsterID != "" {
		if monster, ok := rt.Registry.Monsters[rt.State.UI.CurrentMonsterID]; ok {
			m := monster
			rt.ContentState.ActiveMonster = &m
		}
	}

	skillID := rt.State.UI.CurrentSkillID
	if rt.State.Activity.SkillID != "" {
		skillID = rt.State.Activity.SkillID
	}

	if skillID != "" {
		if skill, ok := rt.Registry.Skills[skillID]; ok {
			s := skill
			rt.ContentState.ActiveSkill = &s

			nodeID := rt.State.Activity.NodeID
			if nodeID != "" {
				for i := range s.Nodes {
					if s.Nodes[i].ID == nodeID {
						rt.ContentState.ActiveNode = &s.Nodes[i]
						break
					}
				}
			}
		}
	}
}

func (rt *Runtime) Tick(deltaMS int64, nowMS int64) (bool, error) {
	if rt.State == nil {
		return false, errors.New("runtime not initialized")
	}

	rt.hydrate()
	changed := game.Tick(rt.State, rt.ContentState, deltaMS, nowMS)
	rt.hydrate()

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

	if err := game.Dispatch(rt.State, game.Action{
		Type: action.Type,
		ID:   action.ID,
	}, nowMS); err != nil {
		return err
	}

	rt.hydrate()

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
