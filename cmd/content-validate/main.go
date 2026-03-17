package main

import (
	"fmt"
	"os"

	"github.com/LeGoatest/Pwa-idle-game/internal/content"
)

func main() {
	ensureFile("content/items.jsonl", "")
	ensureFile("content/skills_index.json", "{\n  \"skills\": []\n}\n")
	ensureFile("content/zones_index.json", "{\n  \"zones\": []\n}\n")
	ensureFile("content/shop_index.json", "{\n  \"items\": []\n}\n")

	reg, err := content.LoadRegistry("./content")
	if err != nil {
		panic(err)
	}

	fmt.Printf("content valid\n")
	fmt.Printf("items: %d\n", len(reg.ItemsList))
	fmt.Printf("skills: %d\n", len(reg.SkillsList))
	fmt.Printf("zones: %d\n", len(reg.ZonesList))
	fmt.Printf("monsters: %d\n", len(reg.MonstersList))
	fmt.Printf("shop items: %d\n", len(reg.ShopIndex.Items))
	fmt.Printf("drop tables: 0\n")
}

func ensureFile(path string, body string) {
	if _, err := os.Stat(path); err == nil {
		return
	}
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		panic(err)
	}
}
