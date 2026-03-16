package storage

type SaveEnvelope struct {
	StateJSON string `json:"stateJson"`
	Version   int    `json:"version"`
	UpdatedAt int64  `json:"updatedAt"`
}
