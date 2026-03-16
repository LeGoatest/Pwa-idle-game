package content

import "fmt"

func ValidateRegistry(r *Registry) error {
	for id, item := range r.Items {
		if item.ID == "" {
			return fmt.Errorf("item map entry %q missing id", id)
		}
	}

	for _, zone := range r.ZonesList {
		if zone.ID == "" {
			return fmt.Errorf("zone missing id")
		}
		for _, monsterID := range zone.Monsters {
			if _, ok := r.Monsters[monsterID]; !ok {
				return fmt.Errorf("zone %s references missing monster %s", zone.ID, monsterID)
			}
		}
	}

	for _, monster := range r.MonstersList {
		if monster.ID == "" {
			return fmt.Errorf("monster missing id")
		}
		if monster.Loot != nil {
			for _, drop := range monster.Loot.Drops {
				if drop.Item == "" {
					return fmt.Errorf("monster %s has loot drop with empty item", monster.ID)
				}
				if _, ok := r.Items[drop.Item]; !ok {
					return fmt.Errorf("monster %s references missing drop item %s", monster.ID, drop.Item)
				}
			}
		}
	}

	for _, skill := range r.SkillsList {
		if skill.ID == "" {
			return fmt.Errorf("skill missing id")
		}
		for _, node := range skill.Nodes {
			if node.Yield.Item == "" {
				return fmt.Errorf("skill %s node %s missing yield item", skill.ID, node.ID)
			}
			if _, ok := r.Items[node.Yield.Item]; !ok {
				return fmt.Errorf("skill %s node %s references missing item %s", skill.ID, node.ID, node.Yield.Item)
			}
		}
	}

	return nil
}
