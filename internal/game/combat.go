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

func
