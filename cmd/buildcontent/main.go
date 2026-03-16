package main

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"

	"github.com/LeGoatest/Pwa-idle-game/internal/content"
)

func main() {
	reg, err := content.LoadRegistry("./content")
	if err != nil {
		log.Fatal(err)
	}

	if err := os.MkdirAll("dist/content", 0o755); err != nil {
		log.Fatal(err)
	}

	writeJSON("dist/content/registry.json", reg)
}

func writeJSON(path string, value any) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		log.Fatal(err)
	}

	data, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		log.Fatal(err)
	}

	if err := os.WriteFile(path, data, 0o644); err != nil {
		log.Fatal(err)
	}
}
