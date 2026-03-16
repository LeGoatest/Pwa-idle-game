package game

import (
	"crypto/rand"
	"encoding/hex"
)

func CreateInstallID() string {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return ""
	}
	return "install-" + hex.EncodeToString(buf)
}

func InitMeta(nowMS int64) *MetaState {
	return &MetaState{
		InstallID:      CreateInstallID(),
		InstalledAt:    nowMS,
		LaunchCount:    1,
		LastLaunchedAt: nowMS,
	}
}

func UpdateMetaLaunch(meta *MetaState, nowMS int64) {
	if meta == nil {
		return
	}

	if meta.InstallID == "" {
		meta.InstallID = CreateInstallID()
		meta.InstalledAt = nowMS
	}

	meta.LaunchCount += 1
	meta.LastLaunchedAt = nowMS
}
