package game

import "github.com/LeGoatest/Pwa-idle-game/internal/content"

func ResolveContentState(state *GameState, reg *content.Registry) ContentState {
	var out ContentState

	if state == nil || reg == nil {
		return out
	}

	if state.Activity.Kind == "combat" && state.Activity.MonsterID != "" {
		if monster, ok := reg.Monsters[state.Activity.MonsterID]; ok {
			m := monster
			out.ActiveMonster = &m
		}
	} else if state.UI.CurrentMonsterID != "" {
		if monster, ok := reg.Monsters[state.UI.CurrentMonsterID]; ok {
			m := monster
			out.ActiveMonster = &m
		}
	}

	skillID := state.UI.CurrentSkillID
	if state.Activity.SkillID != "" {
		skillID = state.Activity.SkillID
	}

	if skillID != "" {
		if skill, ok := reg.Skills[skillID]; ok {
			s := skill
			out.ActiveSkill = &s

			nodeID := state.Activity.NodeID
			if nodeID != "" {
				for i := range s.Nodes {
					if s.Nodes[i].ID == nodeID {
						out.ActiveNode = &s.Nodes[i]
						break
					}
				}
			}
		}
	}

	return out
}
