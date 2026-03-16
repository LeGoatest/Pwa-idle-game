package content

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func LoadDropTables(basePath string) ([]DropTable, error) {
	dir := filepath.Join(basePath, "drop_tables")

	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return []DropTable{}, nil
		}
		return nil, err
	}

	ids := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !strings.HasSuffix(name, ".json") {
			continue
		}
		ids = append(ids, strings.TrimSuffix(name, ".json"))
	}

	sort.Strings(ids)
	return loadByIDs[DropTable](dir, ids)
}
