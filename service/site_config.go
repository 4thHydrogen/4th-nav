package service

import (
	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/repository"
	"github.com/4thHydrogen/4th-nav/types"
)

func GetSiteConfig() types.SiteConfig {
	siteConfig, err := repository.GetSiteConfig()
	if err != nil {
		logger.LogError("鑾峰彇缃戠珯閰嶇疆澶辫触: %s", err)
		return types.SiteConfig{
			Id:                 1,
			NoImageMode:        false,
			CompactMode:        false,
			ColumnsPerRow:      12,
			Density:            "standard",
			FolderListItemSize: 28,
		}
	}
	return siteConfig
}

func UpdateSiteConfig(data types.SiteConfig) error {
	density := data.Density
	if density == "" {
		density = "standard"
	}

	folderListItemSize := data.FolderListItemSize
	if folderListItemSize < 20 {
		folderListItemSize = 20
	}
	if folderListItemSize > 60 {
		folderListItemSize = 60
	}

	return repository.UpdateSiteConfig(types.SiteConfig{
		Id:                 data.Id,
		NoImageMode:        data.NoImageMode,
		CompactMode:        data.CompactMode,
		ColumnsPerRow:      data.ColumnsPerRow,
		IconSize:           data.IconSize,
		Density:            density,
		FolderListItemSize: folderListItemSize,
	})
}
