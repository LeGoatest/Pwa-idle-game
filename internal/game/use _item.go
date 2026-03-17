package game

import "github.com/LeGoatest/Pwa-idle-game/internal/content"

func UseItem(state *GameState, reg *content.Registry, itemID string) bool {
	if state == nil || reg == nil || itemID == "" {
		return false
	}

	item, ok := reg.Items[itemID]
	if !ok {
		return false
	}

	if item.Effect == nil {
		return false
	}

	if state.Inventory[itemID] <= 0 {
		return false
	}

	switch item.Effect.Type {
	case "heal":
		if !RemoveItem(state, itemID, 1) {
			return false
		}
		state.HP += item.Effect.Value
		return true
	default:
		return false
	}
}
