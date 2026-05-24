package repository

import (
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
	_ "modernc.org/sqlite"
)

func setupSettingsRepositoryTestDB(t *testing.T) *sql.DB {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "settings-repo-test.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	stmts := []string{
		`CREATE TABLE nav_setting (
			id INTEGER PRIMARY KEY,
			favicon TEXT,
			title TEXT,
			govRecord TEXT,
			logo192 TEXT,
			logo512 TEXT,
			hideAdmin BOOLEAN,
			hideGithub BOOLEAN,
			hideToggleJumpTarget BOOLEAN,
			jumpTargetBlank BOOLEAN,
			backgroundUrl TEXT,
			enableBackground BOOLEAN,
			enableSurfaceEffects BOOLEAN,
			pexelsApiKey TEXT,
			proxy TEXT
		);`,
		`CREATE TABLE nav_site_config (
			id INTEGER PRIMARY KEY,
			noImageMode BOOLEAN,
			compactMode BOOLEAN,
			columnsPerRow INTEGER,
			iconSize INTEGER,
			density TEXT,
			folder_list_item_size INTEGER
		);`,
	}
	for _, stmt := range stmts {
		if _, err := db.Exec(stmt); err != nil {
			t.Fatalf("create schema: %v", err)
		}
	}

	database.DB = db
	t.Cleanup(func() {
		_ = db.Close()
	})
	return db
}

func TestGetAndUpdateSetting(t *testing.T) {
	db := setupSettingsRepositoryTestDB(t)
	if _, err := db.Exec(`
		INSERT INTO nav_setting (
			id, favicon, title, govRecord, logo192, logo512, hideAdmin, hideGithub, hideToggleJumpTarget, jumpTargetBlank, backgroundUrl, enableBackground, enableSurfaceEffects, pexelsApiKey, proxy
		) VALUES (1, 'favicon.ico', 'Van Nav', '', 'logo192.png', 'logo512.png', 0, 1, 0, 1, '', 0, 1, 'key', 'proxy');
	`); err != nil {
		t.Fatalf("seed setting: %v", err)
	}

	setting, err := GetSetting()
	if err != nil {
		t.Fatalf("get setting: %v", err)
	}
	if setting.HideGithub != true || setting.EnableSurfaceEffects != true || setting.PexelsApiKey != "key" {
		t.Fatalf("unexpected setting normalization: %+v", setting)
	}

	err = UpdateSetting(types.Setting{
		Favicon:              "new.ico",
		Title:                "New Title",
		GovRecord:            "abc",
		Logo192:              "a.png",
		Logo512:              "b.png",
		HideAdmin:            true,
		HideGithub:           false,
		HideToggleJumpTarget: true,
		JumpTargetBlank:      false,
		BackgroundUrl:        "bg",
		EnableBackground:     true,
		EnableSurfaceEffects: false,
		PexelsApiKey:         "new-key",
		Proxy:                "new-proxy",
	})
	if err != nil {
		t.Fatalf("update setting: %v", err)
	}

	var title, proxy string
	var hideAdmin int
	if err := db.QueryRow(`SELECT title, proxy, hideAdmin FROM nav_setting WHERE id = 1`).Scan(&title, &proxy, &hideAdmin); err != nil {
		t.Fatalf("load setting: %v", err)
	}
	if title != "New Title" || proxy != "new-proxy" || hideAdmin != 1 {
		t.Fatalf("unexpected stored setting: %s %s %d", title, proxy, hideAdmin)
	}
}

func TestGetAndUpdateSiteConfig(t *testing.T) {
	db := setupSettingsRepositoryTestDB(t)
	if _, err := db.Exec(`
		INSERT INTO nav_site_config (id, noImageMode, compactMode, columnsPerRow, iconSize, density, folder_list_item_size)
		VALUES (1, 1, 0, 1, 2, '', 99);
	`); err != nil {
		t.Fatalf("seed site config: %v", err)
	}

	config, err := GetSiteConfig()
	if err != nil {
		t.Fatalf("get site config: %v", err)
	}
	if config.ColumnsPerRow != 3 || config.Density != "standard" || config.FolderListItemSize != 60 {
		t.Fatalf("unexpected site config normalization: %+v", config)
	}

	err = UpdateSiteConfig(types.SiteConfig{
		NoImageMode:        false,
		CompactMode:        true,
		ColumnsPerRow:      4,
		IconSize:           3,
		Density:            "dense",
		FolderListItemSize: 24,
	})
	if err != nil {
		t.Fatalf("update site config: %v", err)
	}

	var compactMode, columnsPerRow, folderSize int
	var density string
	if err := db.QueryRow(`SELECT compactMode, columnsPerRow, density, folder_list_item_size FROM nav_site_config WHERE id = 1`).Scan(&compactMode, &columnsPerRow, &density, &folderSize); err != nil {
		t.Fatalf("load site config: %v", err)
	}
	if compactMode != 1 || columnsPerRow != 4 || density != "dense" || folderSize != 24 {
		t.Fatalf("unexpected stored site config: %d %d %s %d", compactMode, columnsPerRow, density, folderSize)
	}
}
