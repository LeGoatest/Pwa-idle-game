package game

import "github.com/LeGoatest/Pwa-idle-game/internal/content"

func ApplyCombatRewards(state *GameState, reg *content.Registry, monster *content.Monster) bool {
	if state == nil || monster == nil {
		return false
	}

	changed := false

	if monster.Loot != nil && monster.Loot.Gold != nil {
		state.Gold += rollInt(monster.Loot.Gold.Min, monster.Loot.Gold.Max)
		changed = true
	}

	if monster.Loot != nil {
		for _, drop := range monster.Loot.Drops {
			if drop.Item == "" {
				continue
			}
			if rollChance(drop.Chance) {
				amount := rollInt(maxInt(drop.Min, 1), maxInt(drop.Max, 1))
				AddItem(state, drop.Item, amount)
				changed = true
			}
		}
	}

	if monster.DropTable != "" {
		if RollDropTable(state, reg, monster.DropTable) {
			changed = true
		}
	}

	xp := monster.XP
	if xp <= 0 {
		xp = 5
	}
	GainXP(state, "combat", float64(xp))
	changed = true

	return changed
}

func ResetEnemyFromMonster(state *GameState, monster *content.Monster) {
	if state == nil || monster == nil {
		return
	}

	if monster.HP > 0 {
		state.EnemyHP = monster.HP
		state.EnemyMaxHP = monster.HP
		return
	}

	state.EnemyHP = 12
	state.EnemyMaxHP = 12
}
