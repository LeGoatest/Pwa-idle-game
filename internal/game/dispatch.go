package game

import "fmt"

func Dispatch(state *GameState, action Action, nowMS int64) error {
	switch action.Type {
	case "stop_activity":
		StopActivity(state)
		return nil

	case "open_zone":
		state.UI.CurrentZoneID = action.ID
		state.UI.Tab = "map"
		return nil

	case "select_monster":
		state.UI.CurrentMonsterID = action.ID
		state.UI.Tab = "combat"
		return nil

	case "select_skill":
		state.UI.CurrentSkillID = action.ID
		state.UI.Tab = "skills"
		return nil

	case "start_combat":
		StartActivity(state, ActivityState{
			Kind:      "combat",
			ZoneID:    state.UI.CurrentZoneID,
			MonsterID: action.ID,
		}, nowMS)
		state.UI.CurrentMonsterID = action.ID
		state.UI.Tab = "combat"
		return nil

	case "start_node":
		StartActivity(state, ActivityState{
			Kind:    "node",
			SkillID: state.UI.CurrentSkillID,
			NodeID:  action.ID,
		}, nowMS)
		state.UI.Tab = "skills"
		return nil

	default:
		return fmt.Errorf("unsupported action type: %s", action.Type)
	}
}
