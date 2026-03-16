package main

import (
	"fmt"
	"log"

	"github.com/LeGoatest/Pwa-idle-game/internal/content"
)

func main() {
	reg, err := content.LoadRegistry("./content")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("content valid\n")
	fmt.Printf("items: %d\n", len(reg.ItemsList))
	fmt.Printf("skills: %d\n", len(reg.SkillsList))
	fmt.Printf("zones: %d\n", len(reg.ZonesList))
	fmt.Printf("monsters: %d\n", len(reg.MonstersList))
	fmt.Printf("shop items: %d\n", len(reg.ShopItemsList))
	fmt.Printf("drop tables: %d\n", len(reg.DropTablesList))
}
