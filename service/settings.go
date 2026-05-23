package service

import (
	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/repository"
	"github.com/4thHydrogen/4th-nav/types"
)

func GetSetting() types.Setting {
	setting, err := repository.GetSetting()
	if err != nil {
		logger.LogError("鑾峰彇閰嶇疆澶辫触: %s", err)
		return types.Setting{
			Id:                   1,
			Favicon:              "favicon.ico",
			Title:                "Van Nav",
			GovRecord:            "",
			Logo192:              "logo192.png",
			Logo512:              "logo512.png",
			HideAdmin:            false,
			HideGithub:           false,
			HideToggleJumpTarget: false,
			JumpTargetBlank:      true,
			BackgroundUrl:        "",
			EnableBackground:     false,
			EnableGlassmorphism:  false,
		}
	}
	return setting
}

func UpdateSetting(data types.Setting) error {
	return repository.UpdateSetting(data)
}
