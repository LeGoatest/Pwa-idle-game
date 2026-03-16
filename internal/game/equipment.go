package game

func EquipItem(state *GameState, slot string, itemID string) {
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

func UnequipItem(state *GameState, slot string) {
	EquipItem(state, slot, "")
}
