package game

import "github.com/LeGoatest/Pwa-idle-game/internal/content"

func BuyShopItem(state *GameState, reg *content.Registry, itemID string) bool {
	if state == nil || reg == nil || itemID == "" {
		return false
	}

	listing, ok := content.GetShopListing(reg, itemID)
	if !ok {
		return false
	}

	item, ok := reg.Items[itemID]
	if !ok {
		return false
	}

	if state.Gold < listing.Price {
		return false
	}

	state.Gold -= listing.Price

	if item.Effect != nil {
		switch item.Effect.Type {
		case "stat":
			switch item.Stats["stat"] {
			case "attack":
				state.Attack += item.Effect.Value
			case "defense":
				state.Defense += item.Effect.Value
			case "hp":
				state.HP += item.Effect.Value
			}
			return true

		case "heal":
			state.HP += item.Effect.Value
			return true
		}
	}

	AddItem(state, item.ID, 1)
	return true
}
