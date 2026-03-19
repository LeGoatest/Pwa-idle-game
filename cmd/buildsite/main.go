package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/LeGoatest/Pwa-idle-game/internal/content"
	"github.com/LeGoatest/Pwa-idle-game/internal/game"
	"github.com/LeGoatest/Pwa-idle-game/web/views/app"
	"github.com/LeGoatest/Pwa-idle-game/web/views/components"
)

func main() {
	reg, err := content.LoadRegistry("./content")
	if err != nil {
		log.Fatal(err)
	}

	state := game.NewDefaultState(time.Now().UnixMilli())

	if state.UI.CurrentZoneID == "" && len(reg.ZonesIndex.Zones) > 0 {
		state.UI.CurrentZoneID = reg.ZonesIndex.Zones[0].ID
	}

	if state.UI.CurrentSkillID == "" && len(reg.SkillsIndex.Skills) > 0 {
		state.UI.CurrentSkillID = reg.SkillsIndex.Skills[0]
	}

	if state.UI.CurrentZoneID != "" {
		if zone, ok := reg.Zones[state.UI.CurrentZoneID]; ok && len(zone.Monsters) > 0 {
			state.UI.CurrentMonsterID = zone.Monsters[0]
		}
	}

	ctx := context.Background()

	mustRender("dist/index.html", func(f *os.File) error {
		return app.Root(state, reg).Render(ctx, f)
	})

	mustRender("dist/views/stats.html", func(f *os.File) error {
		return app.CharacterScreen(state).Render(ctx, f)
	})

	mustRender("dist/views/activity.html", func(f *os.File) error {
		return app.CombatScreen(state, reg).Render(ctx, f)
	})

	mustRender("dist/views/inventory.html", func(f *os.File) error {
		return app.InventoryScreen(state).Render(ctx, f)
	})

	mustRender("dist/views/selections.html", func(f *os.File) error {
		if err := components.ZoneList(state, reg).Render(ctx, f); err != nil {
			return err
		}
		if err := components.MonsterList(state, reg).Render(ctx, f); err != nil {
			return err
		}
		return components.SkillList(state, reg).Render(ctx, f)
	})
}

func mustRender(path string, render func(*os.File) error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		log.Fatal(err)
	}

	f, err := os.Create(path)
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()

	if err := render(f); err != nil {
		log.Fatal(err)
	}
}
