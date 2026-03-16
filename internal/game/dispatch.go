package game

import (
	"fmt"
	"strings"
)

func Dispatch(state *GameState, action Action) error {
	switch strings.TrimSpace(action.Type) {
	case "":
		return fmt.Errorf("action type is required")

	case "start_combat":
		state.Activity = ActivityState{
			Kind:      "combat",
			MonsterID: action.ID,
			Progress:  0,
		}
		state.UI.Tab = "combat"
		return nil

	case "stop_activity":
		state.Activity = ActivityState{
			Kind: "none",
		}
		return nil

	case "open_zone":
		state.UI.CurrentZoneID = action.ID
		state.UI.Tab = "map"
		return nil

	case "select_monster":
		state.UI.CurrentMonsterID = action.ID
		return nil

	case "select_skill":
		state.UI.CurrentSkillID = action.ID
		state.UI.Tab = "skills"
		return nil

	default:
		return fmt.Errorf("unsupported action type: %s", action.Type)
	}
}
