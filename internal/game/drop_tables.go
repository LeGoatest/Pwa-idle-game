package game

import (
	"math/rand"

	"github.com/LeGoatest/Pwa-idle-game/internal/content"
)

func RollDropTable(state *GameState, reg *content.Registry, tableID string) bool {
	if state == nil || reg == nil || tableID == "" {
		return false
	}

	table, ok := reg.DropTables[tableID]
	if !ok {
		return false
	}

	changed := false

	for _, drop := range table.Drops {
		if drop.Item == "" {
			continue
		}

		if rand.Float64() < drop.Chance {
			amount := maxInt(drop.Min, 1)
			if drop.Max >= amount {
				amount = rollInt(maxInt(drop.Min, 1), maxInt(drop.Max, 1))
			}

			AddItem(state, drop.Item, amount)
			changed = true
		}
	}

	return changed
}
