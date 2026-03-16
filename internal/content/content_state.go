package main

import "github.com/LeGoatest/Pwa-idle-game/internal/content"

func resolveMonster(reg *content.Registry, id string) *content.Monster {
	if reg == nil || id == "" {
		return nil
	}

	monster, ok := reg.Monsters[id]
	if !ok {
		return nil
	}

	m := monster
	return &m
}

func resolveSkill(reg *content.Registry, id string) *content.Skill {
	if reg == nil || id == "" {
		return nil
	}

	skill, ok := reg.Skills[id]
	if !ok {
		return nil
	}

	s := skill
	return &s
}

func resolveNode(skill *content.Skill, id string) *content.SkillNode {
	if skill == nil || id == "" {
		return nil
	}

	for i := range skill.Nodes {
		if skill.Nodes[i].ID == id {
			return &skill.Nodes[i]
		}
	}

	return nil
}
