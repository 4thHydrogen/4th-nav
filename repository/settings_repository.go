package repository

import (
	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
)

func GetSetting() (types.Setting, error) {
	row := database.DB.QueryRow(`
		SELECT id, favicon, title, govRecord, logo192, logo512, hideAdmin, hideGithub, hideToggleJumpTarget, jumpTargetBlank, backgroundUrl, enableBackground, enableGlassmorphism, pexelsApiKey, proxy
		FROM nav_setting
		ORDER BY id ASC
		LIMIT 1;
	`)

	var setting types.Setting
	var hideAdmin, hideGithub, hideToggleJumpTarget, jumpTargetBlank any
	var backgroundURL, enableBackground, enableGlassmorphism, pexelsAPIKey, proxy any
	err := row.Scan(
		&setting.Id,
		&setting.Favicon,
		&setting.Title,
		&setting.GovRecord,
		&setting.Logo192,
		&setting.Logo512,
		&hideAdmin,
		&hideGithub,
		&hideToggleJumpTarget,
		&jumpTargetBlank,
		&backgroundURL,
		&enableBackground,
		&enableGlassmorphism,
		&pexelsAPIKey,
		&proxy,
	)
	if err != nil {
		return types.Setting{}, err
	}

	setting.HideAdmin = boolFromDB(hideAdmin, false)
	setting.HideGithub = boolFromDB(hideGithub, false)
	setting.HideToggleJumpTarget = boolFromDB(hideToggleJumpTarget, false)
	setting.JumpTargetBlank = boolFromDB(jumpTargetBlank, true)
	setting.BackgroundUrl = stringFromDB(backgroundURL, "")
	setting.EnableBackground = boolFromDB(enableBackground, false)
	setting.EnableGlassmorphism = boolFromDB(enableGlassmorphism, false)
	setting.PexelsApiKey = stringFromDB(pexelsAPIKey, "")
	setting.Proxy = stringFromDB(proxy, "")

	return setting, nil
}

func UpdateSetting(data types.Setting) error {
	_, err := database.DB.Exec(`
		UPDATE nav_setting
		SET favicon = ?, title = ?, govRecord = ?, logo192 = ?, logo512 = ?, hideAdmin = ?, hideGithub = ?, hideToggleJumpTarget = ?, jumpTargetBlank = ?, backgroundUrl = ?, enableBackground = ?, enableGlassmorphism = ?, pexelsApiKey = ?, proxy = ?
		WHERE id = (SELECT id FROM nav_setting ORDER BY id ASC LIMIT 1);
	`,
		data.Favicon,
		data.Title,
		data.GovRecord,
		data.Logo192,
		data.Logo512,
		data.HideAdmin,
		data.HideGithub,
		data.HideToggleJumpTarget,
		data.JumpTargetBlank,
		data.BackgroundUrl,
		data.EnableBackground,
		data.EnableGlassmorphism,
		data.PexelsApiKey,
		data.Proxy,
	)
	return err
}

func GetSiteConfig() (types.SiteConfig, error) {
	row := database.DB.QueryRow(`
		SELECT id, noImageMode, compactMode, columnsPerRow, iconSize, density, folder_list_item_size
		FROM nav_site_config
		ORDER BY id ASC
		LIMIT 1;
	`)

	var siteConfig types.SiteConfig
	var noImageMode, compactMode, columnsPerRow, iconSize, density, folderListItemSize any
	err := row.Scan(
		&siteConfig.Id,
		&noImageMode,
		&compactMode,
		&columnsPerRow,
		&iconSize,
		&density,
		&folderListItemSize,
	)
	if err != nil {
		return types.SiteConfig{}, err
	}

	siteConfig.NoImageMode = boolFromDB(noImageMode, false)
	siteConfig.CompactMode = boolFromDB(compactMode, false)
	siteConfig.ColumnsPerRow = intFromDB(columnsPerRow, 3)
	if siteConfig.ColumnsPerRow < 2 {
		siteConfig.ColumnsPerRow = 3
	}
	siteConfig.IconSize = intFromDB(iconSize, 0)
	siteConfig.Density = stringFromDB(density, "standard")
	if siteConfig.Density == "" {
		siteConfig.Density = "standard"
	}
	siteConfig.FolderListItemSize = intFromDB(folderListItemSize, 28)
	if siteConfig.FolderListItemSize < 20 {
		siteConfig.FolderListItemSize = 20
	}
	if siteConfig.FolderListItemSize > 60 {
		siteConfig.FolderListItemSize = 60
	}

	return siteConfig, nil
}

func UpdateSiteConfig(data types.SiteConfig) error {
	_, err := database.DB.Exec(`
		UPDATE nav_site_config
		SET noImageMode = ?, compactMode = ?, columnsPerRow = ?, iconSize = ?, density = ?, folder_list_item_size = ?
		WHERE id = (SELECT id FROM nav_site_config ORDER BY id ASC LIMIT 1);
	`,
		data.NoImageMode,
		data.CompactMode,
		data.ColumnsPerRow,
		data.IconSize,
		data.Density,
		data.FolderListItemSize,
	)
	return err
}

func boolFromDB(value any, defaultValue bool) bool {
	if value == nil {
		return defaultValue
	}
	return value.(int64) != 0
}

func stringFromDB(value any, defaultValue string) string {
	if value == nil {
		return defaultValue
	}
	return value.(string)
}

func intFromDB(value any, defaultValue int) int {
	if value == nil {
		return defaultValue
	}
	return int(value.(int64))
}
