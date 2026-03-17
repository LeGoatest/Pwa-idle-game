package content

func GetItem(reg *Registry, id string) (Item, bool) {
	item, ok := reg.Items[id]
	return item, ok
}

func GetMonster(reg *Registry, id string) (Monster, bool) {
	monster, ok := reg.Monsters[id]
	return monster, ok
}

func GetZone(reg *Registry, id string) (Zone, bool) {
	zone, ok := reg.Zones[id]
	return zone, ok
}

func GetSkill(reg *Registry, id string) (Skill, bool) {
	skill, ok := reg.Skills[id]
	return skill, ok
}

func GetShopListing(reg *Registry, id string) (ShopListing, bool) {
	for _, listing := range reg.ShopIndex.Items {
		if listing.ID == id {
			return listing, true
		}
	}
	return ShopListing{}, false
}

func GetItemsByTag(reg *Registry, tag string) []Item {
	out := make([]Item, 0)
	for _, item := range reg.ItemsList {
		for _, t := range item.Tags {
			if t == tag {
				out = append(out, item)
				break
			}
		}
	}
	return out
}
