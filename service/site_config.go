package service

import (
	"github.com/mereith/nav/database"
	"github.com/mereith/nav/logger"
	"github.com/mereith/nav/types"
)

func GetSiteConfig() types.SiteConfig {
	sql_get_site_config := `
		SELECT id, noImageMode, compactMode, columnsPerRow, iconSize, density
		FROM nav_site_config
		ORDER BY id ASC
		LIMIT 1;
		`
	var siteConfig types.SiteConfig
	row := database.DB.QueryRow(sql_get_site_config)
	var noImageMode interface{}
	var compactMode interface{}
	var columnsPerRow interface{}
	var iconSize interface{}
	var density interface{}
	err := row.Scan(&siteConfig.Id, &noImageMode, &compactMode, &columnsPerRow, &iconSize, &density)
	if err != nil {
		logger.LogError("获取网站配置失败: %s", err)
		return types.SiteConfig{
			Id:            1,
			NoImageMode:   false,
			CompactMode:   false,
			ColumnsPerRow: 3,
			Density:       "standard",
		}
	}

	if noImageMode == nil {
		siteConfig.NoImageMode = false
	} else {
		if noImageMode.(int64) == 0 {
			siteConfig.NoImageMode = false
		} else {
			siteConfig.NoImageMode = true
		}
	}

	if compactMode == nil {
		siteConfig.CompactMode = false
	} else {
		if compactMode.(int64) == 0 {
			siteConfig.CompactMode = false
		} else {
			siteConfig.CompactMode = true
		}
	}

	if columnsPerRow == nil {
		siteConfig.ColumnsPerRow = 3
	} else {
		siteConfig.ColumnsPerRow = int(columnsPerRow.(int64))
		if siteConfig.ColumnsPerRow < 2 {
			siteConfig.ColumnsPerRow = 3
		}
	}

	if iconSize == nil {
		siteConfig.IconSize = 0
	} else {
		siteConfig.IconSize = int(iconSize.(int64))
	}

	if density == nil || density.(string) == "" {
		siteConfig.Density = "standard"
	} else {
		siteConfig.Density = density.(string)
	}

	return siteConfig
}

func UpdateSiteConfig(data types.SiteConfig) error {
	density := data.Density
	if density == "" {
		density = "standard"
	}

	sql_update_site_config := `
		UPDATE nav_site_config
		SET noImageMode = ?, compactMode = ?, columnsPerRow = ?, iconSize = ?, density = ?
		WHERE id = (SELECT id FROM nav_site_config ORDER BY id ASC LIMIT 1);
		`

	stmt, err := database.DB.Prepare(sql_update_site_config)
	if err != nil {
		return err
	}
	res, err := stmt.Exec(data.NoImageMode, data.CompactMode, data.ColumnsPerRow, data.IconSize, density)
	if err != nil {
		return err
	}
	_, err = res.RowsAffected()
	if err != nil {
		return err
	}
	return nil
}
