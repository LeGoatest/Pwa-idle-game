package game

func SetTab(state *GameState, tab string) {
	state.UI.Tab = tab
}

func SelectZone(state *GameState, zoneID string) {
	state.UI.CurrentZoneID = zoneID
}

func SelectMonster(state *GameState, monsterID string) {
	state.UI.CurrentMonsterID = monsterID
}

func SelectSkill(state *GameState, skillID string) {
	state.UI.CurrentSkillID = skillID
}
