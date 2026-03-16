package game

import "github.com/LeGoatest/Pwa-idle-game/internal/content"

func BuyShopItem(state *GameState, reg *content.Registry, itemID string) bool {
	if state == nil || reg == nil || itemID == "" {
		return false
	}

	item, ok := reg.ShopItems[itemID]
	if !ok {
		return false
	}

	if state.Gold < item.Price {
		return false
	}

	state.Gold -= item.Price

	if item.Effect != nil {
		switch item.Effect.Type {
		case "stat":
			switch item.Effect.Stat {
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

		case "item":
			if item.Effect.ItemKey != "" {
				amount := item.Effect.Amount
				if amount <= 0 {
					amount = 1
				}
				AddItem(state, item.Effect.ItemKey, amount)
				return true
			}
		}
	}

	AddItem(state, item.ID, 1)
	return true
}
