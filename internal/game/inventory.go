package game

func AddItem(state *GameState, itemID string, amount int) {
	if itemID == "" || amount <= 0 {
		return
	}

	if state.Inventory == nil {
		state.Inventory = map[string]int{}
	}

	state.Inventory[itemID] += amount
}

func RemoveItem(state *GameState, itemID string, amount int) bool {
	if itemID == "" || amount <= 0 {
		return false
	}

	current := state.Inventory[itemID]
	if current < amount {
		return false
	}

	next := current - amount
	if next == 0 {
		delete(state.Inventory, itemID)
	} else {
		state.Inventory[itemID] = next
	}

	return true
}
