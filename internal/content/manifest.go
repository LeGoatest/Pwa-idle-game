package content

type Manifest struct {
	Counts   ManifestCounts   `json:"counts"`
	Indexes  ManifestIndexes  `json:"indexes"`
	Warnings []string         `json:"warnings,omitempty"`
}

type ManifestCounts struct {
	Items      int `json:"items"`
	Skills     int `json:"skills"`
	Zones      int `json:"zones"`
	Monsters   int `json:"monsters"`
	ShopItems  int `json:"shopItems"`
	DropTables int `json:"dropTables"`
}

type ManifestIndexes struct {
	Skills []string `json:"skills"`
	Zones  []string `json:"zones"`
	Shop   []string `json:"shop"`
}

func BuildManifest(reg *Registry) Manifest {
	if reg == nil {
		return Manifest{}
	}

	skillIDs := make([]string, 0, len(reg.SkillsIndex.Skills))
	skillIDs = append(skillIDs, reg.SkillsIndex.Skills...)

	zoneIDs := make([]string, 0, len(reg.ZonesIndex.Zones))
	for _, z := range reg.ZonesIndex.Zones {
		if z.ID != "" {
			zoneIDs = append(zoneIDs, z.ID)
		}
	}

	shopIDs := make([]string, 0, len(reg.ShopIndex.Items))
	shopIDs = append(shopIDs, reg.ShopIndex.Items...)

	return Manifest{
		Counts: ManifestCounts{
			Items:      len(reg.ItemsList),
			Skills:     len(reg.SkillsList),
			Zones:      len(reg.ZonesList),
			Monsters:   len(reg.MonstersList),
			ShopItems:  len(reg.ShopItemsList),
			DropTables: len(reg.DropTablesList),
		},
		Indexes: ManifestIndexes{
			Skills: skillIDs,
			Zones:  zoneIDs,
			Shop:   shopIDs,
		},
	}
}
