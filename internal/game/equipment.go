package game

import "github.com/LeGoatest/Pwa-idle-game/internal/content"

func EquipItem(state *GameState, reg *content.Registry, itemID string) bool {
	if state == nil || reg == nil || itemID == "" {
		return false
	}

	item, ok := reg.Items[itemID]
	if !ok {
		return false
	}

	if item.EquipSlot == "" {
		return false
	}

	if state.Inventory[itemID] <= 0 {
		return false
	}

	current := equippedItemForSlot(state, item.EquipSlot)
	if current == itemID {
		return true
	}

	if current != "" {
		AddItem(state, current, 1)
	}

	if !RemoveItem(state, itemID, 1) {
		return false
	}

	setEquippedItemForSlot(state, item.EquipSlot, itemID)
	return true
}

func UnequipItem(state *GameState, slot string) bool {
	if state == nil || slot == "" {
		return false
	}

	current := equippedItemForSlot(state, slot)
	if current == "" {
		return false
	}

	AddItem(state, current, 1)
	setEquippedItemForSlot(state, slot, "")
	return true
}

func equippedItemForSlot(state *GameState, slot string) string {
	switch slot {
	case "weapon":
		return state.Equipment.Weapon
	case "head":
		return state.Equipment.Head
	case "chest":
		return state.Equipment.Chest
	case "offhand":
		return state.Equipment.Offhand
	case "feet":
		return state.Equipment.Feet
	default:
		return ""
	}
}

func setEquippedItemForSlot(state *GameState, slot, itemID string) {
	switch slot {
	case "weapon":
		state.Equipment.Weapon = itemID
	case "head":
		state.Equipment.Head = itemID
	case "chest":
		state.Equipment.Chest = itemID
	case "offhand":
		state.Equipment.Offhand = itemID
	case "feet":
		state.Equipment.Feet = itemID
	}
}
