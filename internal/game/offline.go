package game

func ClampOffline(elapsedMS int64) int64 {
	if elapsedMS <= 0 {
		return 0
	}
	if elapsedMS > MaxOfflineMS {
		return MaxOfflineMS
	}
	return elapsedMS
}

func OfflineSummary(before, after *GameState) map[string]any {
	if before == nil || after == nil {
		return map[string]any{}
	}

	inventoryDiff := map[string]int{}
	itemIDs := map[string]struct{}{}

	for k := range before.Inventory {
		itemIDs[k] = struct{}{}
	}
	for k := range after.Inventory {
		itemIDs[k] = struct{}{}
	}

	for itemID := range itemIDs {
		diff := after.Inventory[itemID] - before.Inventory[itemID]
		if diff > 0 {
			inventoryDiff[itemID] = diff
		}
	}

	return map[string]any{
		"gold":      after.Gold - before.Gold,
		"kills":     after.Kills - before.Kills,
		"inventory": inventoryDiff,
	}
}
