package content

import (
	"os"
	"path/filepath"
	"sort"
)

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func LoadRegistry(basePath string) (*Registry, error) {
	items, err := LoadJSONL[Item](filepath.Join(basePath, "items.jsonl"))
	if err != nil {
		return nil, err
	}

	skillsIndex, err := LoadJSON[SkillsIndex](filepath.Join(basePath, "skills_index.json"))
	if err != nil {
		return nil, err
	}

	zonesIndex, err := LoadJSON[ZonesIndex](filepath.Join(basePath, "zones_index.json"))
	if err != nil {
		return nil, err
	}

	shopIndex := ShopIndex{Items: []ShopListing{}}
	shopIndexPath := filepath.Join(basePath, "shop_index.json")
	if fileExists(shopIndexPath) {
		loadedShopIndex, err := LoadJSON[ShopIndex](shopIndexPath)
		if err != nil {
			return nil, err
		}
		shopIndex = loadedShopIndex
	}

	skills, err := loadByIDs[Skill](filepath.Join(basePath, "skills"), skillsIndex.Skills)
	if err != nil {
		return nil, err
	}

	zoneIDs := make([]string, 0, len(zonesIndex.Zones))
	for _, z := range zonesIndex.Zones {
		if z.ID != "" {
			zoneIDs = append(zoneIDs, z.ID)
		}
	}

	zones, err := loadByIDs[Zone](filepath.Join(basePath, "zones"), zoneIDs)
	if err != nil {
		return nil, err
	}

	monsterSet := make(map[string]struct{})
	for _, zone := range zones {
		for _, monsterID := range zone.Monsters {
			if monsterID != "" {
				monsterSet[monsterID] = struct{}{}
			}
		}
	}

	monsterIDs := make([]string, 0, len(monsterSet))
	for id := range monsterSet {
		monsterIDs = append(monsterIDs, id)
	}
	sort.Strings(monsterIDs)

	monsters, err := loadByIDs[Monster](filepath.Join(basePath, "monsters"), monsterIDs)
	if err != nil {
		return nil, err
	}

	reg := &Registry{
		Items:        IndexByID(items),
		ItemsList:    items,
		Skills:       IndexByID(skills),
		SkillsList:   skills,
		Zones:        IndexByID(zones),
		ZonesList:    zones,
		Monsters:     IndexByID(monsters),
		MonstersList: monsters,
		SkillsIndex:  skillsIndex,
		ZonesIndex:   zonesIndex,
		ShopIndex:    shopIndex,
	}

	if err := ValidateRegistry(reg); err != nil {
		return nil, err
	}

	return reg, nil
}
