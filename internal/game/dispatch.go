package game

import (
	"fmt"

	"github.com/LeGoatest/Pwa-idle-game/internal/content"
)

func Dispatch(state *GameState, reg *content.Registry, action Action, nowMS int64) error {
	if state == nil {
		return fmt.Errorf("state is nil")
	}

	switch action.Type {
	case "stop_activity":
		StopActivity(state)
		return nil

	case "cycle_combat_style":
		state.UI.CombatMode = nextCombatMode(state.UI.CombatMode)
		syncCombatSummary(state)
		return nil

	case "open_zone":
		state.UI.CurrentZoneID = action.ID
		state.UI.CurrentMonsterID = ""
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

	case "buy_item":
		if reg == nil {
			return fmt.Errorf("registry is nil")
		}
		if !BuyShopItem(state, reg, action.ID) {
			return fmt.Errorf("unable to buy item: %s", action.ID)
		}
		return nil

	case "equip_item":
		if reg == nil {
			return fmt.Errorf("registry is nil")
		}
		if !EquipItem(state, reg, action.ID) {
			return fmt.Errorf("unable to equip item: %s", action.ID)
		}
		return nil

	case "use_item":
		if reg == nil {
			return fmt.Errorf("registry is nil")
		}
		if !UseItem(state, reg, action.ID) {
			return fmt.Errorf("unable to use item: %s", action.ID)
		}
		return nil

	case "unequip_weapon":
		if !UnequipItem(state, "weapon") {
			return fmt.Errorf("unable to unequip weapon")
		}
		return nil

	case "unequip_head":
		if !UnequipItem(state, "head") {
			return fmt.Errorf("unable to unequip head")
		}
		return nil

	case "unequip_chest":
		if !UnequipItem(state, "chest") {
			return fmt.Errorf("unable to unequip chest")
		}
		return nil

	case "unequip_offhand":
		if !UnequipItem(state, "offhand") {
			return fmt.Errorf("unable to unequip offhand")
		}
		return nil

	case "unequip_feet":
		if !UnequipItem(state, "feet") {
			return fmt.Errorf("unable to unequip feet")
		}
		return nil

	default:
		return fmt.Errorf("unsupported action type: %s", action.Type)
	}
}

func nextCombatMode(mode string) string {
	switch mode {
	case "attack":
		return "strength"
	case "strength":
		return "defense"
	case "defense":
		return "attack"
	default:
		return "attack"
	}
}
