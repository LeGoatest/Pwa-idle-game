package content

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Identifiable interface {
	GetID() string
}

func LoadJSON[T any](path string) (T, error) {
	var out T

	data, err := os.ReadFile(path)
	if err != nil {
		return out, fmt.Errorf("read %s: %w", path, err)
	}

	if err := json.Unmarshal(data, &out); err != nil {
		return out, fmt.Errorf("decode %s: %w", path, err)
	}

	return out, nil
}

func LoadJSONL[T any](path string) ([]T, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open %s: %w", path, err)
	}
	defer f.Close()

	var rows []T
	scanner := bufio.NewScanner(f)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		var row T
		if err := json.Unmarshal([]byte(line), &row); err != nil {
			return nil, fmt.Errorf("decode jsonl line in %s: %w", path, err)
		}

		rows = append(rows, row)
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("scan %s: %w", path, err)
	}

	return rows, nil
}

func IndexByID[T Identifiable](rows []T) map[string]T {
	out := make(map[string]T, len(rows))
	for _, row := range rows {
		id := row.GetID()
		if id == "" {
			continue
		}
		out[id] = row
	}
	return out
}

func loadByIDs[T any](baseDir string, ids []string) ([]T, error) {
	rows := make([]T, 0, len(ids))

	for _, id := range ids {
		path := filepath.Join(baseDir, id+".json")
		row, err := LoadJSON[T](path)
		if err != nil {
			return nil, err
		}
		rows = append(rows, row)
	}

	return rows, nil
}
