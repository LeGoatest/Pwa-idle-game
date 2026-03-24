package game

import (
	"math"
	"math/rand"

	"github.com/LeGoatest/Pwa-idle-game/internal/content"
)

type ContentState struct {
	Registry      *content.Registry
	ActiveMonster *content.Monster
	ActiveNode    *content.SkillNode
	ActiveSkill   *content.Skill
}

func rollInt(min, max int) int {
	if max < min {
		return min
	}
	return rand.Intn(max-min+1) + min
}

func rollChance(chance float64) bool {
	if chance <= 0 {
		return false
	}
	if chance >= 1 {
		return true
	}
	return rand.Float64() < chance
}

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

	xp := monster.XP
	if xp <= 0 {
		xp = 5
	}
	GainXP(state, activeCombatXPBucket(state), float64(xp))
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
		state.EnemyProgress = 0
		return
	}

	state.EnemyHP = 12
	state.EnemyMaxHP = 12
	state.EnemyProgress = 0
}

func ProcessCombat(state *GameState, contentState ContentState, deltaMS int64, nowMS int64) bool {
	monster := contentState.ActiveMonster
	if monster == nil {
		return false
	}

	playerDuration := monster.DurationMS
	if playerDuration <= 0 {
		playerDuration = 2000
	}

	enemyDuration := monster.DurationMS
	if enemyDuration <= 0 {
		enemyDuration = 2000
	}

	state.Activity.Progress += float64(deltaMS)
	state.EnemyProgress += float64(deltaMS)
	state.Activity.LastProcessedAt = nowMS

	changed := false

	for state.Activity.Progress >= float64(playerDuration) {
		state.Activity.Progress -= float64(playerDuration)

		damage := int(math.Max(1, float64(state.Attack)))
		state.EnemyHP -= damage

		if state.EnemyHP <= 0 {
			state.Kills++

			if ApplyCombatRewards(state, contentState.Registry, monster) {
				changed = true
			}

			ResetEnemyFromMonster(state, monster)
		}

		changed = true
	}

	for state.EnemyProgress >= float64(enemyDuration) {
		state.EnemyProgress -= float64(enemyDuration)

		damage := maxInt(1, monster.Attack-state.Defense)
		state.HP -= damage
		if state.HP < 0 {
			state.HP = 0
		}

		changed = true
	}

	return changed
}

func activeCombatXPBucket(state *GameState) string {
	if state == nil {
		return "attack"
	}

	switch state.UI.CombatMode {
	case "strength":
		return "strength"
	case "defense":
		return "defense"
	case "attack":
		return "attack"
	default:
		return "attack"
	}
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}
