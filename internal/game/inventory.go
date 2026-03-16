package game

func AddItem(state *GameState, itemID string, amount int) {
	if amount <= 0 {
		return
	}

	if state.Inventory == nil {
		state.Inventory = map[string]int{}
	}

	state.Inventory[itemID] += amount
}

func RemoveItem(state *GameState, itemID string, amount int) bool {
	if amount <= 0 {
		return true
	}

	current := state.Inventory[itemID]
	if current < amount {
		return false
	}

	current -= amount
	if current == 0 {
		delete(state.Inventory, itemID)
	} else {
		state.Inventory[itemID] = current
	}

	return true
}

func GetItemCount(state *GameState, itemID string) int {
	return state.Inventory[itemID]
}
