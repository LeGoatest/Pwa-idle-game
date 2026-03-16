package main

import "github.com/LeGoatest/Pwa-idle-game/internal/content"

func resolveActiveMonster(reg *content.Registry, monsterID string) *content.Monster {
	if reg == nil || monsterID == "" {
		return nil
	}

	monster, ok := reg.Monsters[monsterID]
	if !ok {
		return nil
	}

	m := monster
	return &m
}

func resolveActiveSkill(reg *content.Registry, skillID string) *content.Skill {
	if reg == nil || skillID == "" {
		return nil
	}

	skill, ok := reg.Skills[skillID]
	if !ok {
		return nil
	}

	s := skill
	return &s
}

func resolveActiveNode(skill *content.Skill, nodeID string) *content.SkillNode {
	if skill == nil || nodeID == "" {
		return nil
	}

	for i := range skill.Nodes {
		if skill.Nodes[i].ID == nodeID {
			return &skill.Nodes[i]
		}
	}

	return nil
}
