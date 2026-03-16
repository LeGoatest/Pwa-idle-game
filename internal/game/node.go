package game

func skillKey(skillID string) string {
	switch skillID {
	case "woodcutting":
		return "wood"
	case "mining":
		return "mine"
	case "combat":
		return "combat"
	default:
		return skillID
	}
}

func ProcessNode(state *GameState, contentState ContentState, deltaMS int64, nowMS int64) bool {
	node := contentState.ActiveNode
	if node == nil {
		return false
	}

	state.Activity.Progress += float64(deltaMS)
	state.Activity.LastProcessedAt = nowMS

	changed := false

	for state.Activity.Progress >= float64(node.DurationMS) {
		state.Activity.Progress -= float64(node.DurationMS)

		if node.Yield.Item != "" {
			amount := node.Yield.Amount
			if amount <= 0 {
				amount = 1
			}
			AddItem(state, node.Yield.Item, amount)
		}

		if node.XP > 0 && contentState.ActiveSkill != nil {
			GainXP(state, skillKey(contentState.ActiveSkill.ID), node.XP)
		}

		changed = true
	}

	return changed
}
