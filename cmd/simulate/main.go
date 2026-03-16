package main

import (
	"fmt"
	"log"
	"time"

	"github.com/LeGoatest/Pwa-idle-game/internal/content"
	"github.com/LeGoatest/Pwa-idle-game/internal/game"
)

func main() {
	reg, err := content.LoadRegistry("./content")
	if err != nil {
		log.Fatal(err)
	}

	nowMS := time.Now().UnixMilli()
	state := game.NewDefaultState(nowMS)

	if state.UI.CurrentZoneID == "" && len(reg.ZonesIndex.Zones) > 0 {
		state.UI.CurrentZoneID = reg.ZonesIndex.Zones[0].ID
	}

	if state.UI.CurrentMonsterID == "" && state.UI.CurrentZoneID != "" {
		if zone, ok := reg.Zones[state.UI.CurrentZoneID]; ok && len(zone.Monsters) > 0 {
			state.UI.CurrentMonsterID = zone.Monsters[0]
		}
	}

	if state.UI.CurrentMonsterID == "" {
		log.Fatal("no monster available to simulate")
	}

	if err := game.Dispatch(state, game.Action{
		Type: "start_combat",
		ID:   state.UI.CurrentMonsterID,
	}, nowMS); err != nil {
		log.Fatal(err)
	}

	contentState := game.ResolveContentState(state, reg)

	simulateFor := int64(60 * 1000)
	step := game.TickMS

	current := nowMS
	for elapsed := int64(0); elapsed < simulateFor; elapsed += step {
		current += step
		game.Tick(state, contentState, step, current)
		contentState = game.ResolveContentState(state, reg)
	}

	fmt.Printf("simulation complete\n")
	fmt.Printf("duration_ms: %d\n", simulateFor)
	fmt.Printf("monster: %s\n", state.UI.CurrentMonsterID)
	fmt.Printf("gold: %d\n", state.Gold)
	fmt.Printf("kills: %d\n", state.Kills)
	fmt.Printf("combat_level: %d\n", state.CombatLevel)
	fmt.Printf("combat_xp: %.2f\n", state.CombatXP)
	fmt.Printf("inventory:\n")
	for itemID, amount := range state.Inventory {
		fmt.Printf("  %s: %d\n", itemID, amount)
	}
}
