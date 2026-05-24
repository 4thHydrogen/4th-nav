// Migration rules (as of 2026-05-24):
//
// 1. runColumnUpgrades/runAdditionalColumnUpgrades exist for backward compatibility
//    with databases created before the migration system was introduced.
// 2. All new fields, new tables, and schema changes MUST go through runMigrations().
// 3. Do NOT add new business fields to runColumnUpgrades or runAdditionalColumnUpgrades.
// 4. Migration files must be idempotent and support stable upgrades from any prior version.
package database

import (
	"database/sql"
	"path/filepath"

	_ "modernc.org/sqlite"

	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/utils"
)

var DB *sql.DB

func columnExists(tableName string, columnName string) bool {
	query := `SELECT COUNT(*) FROM pragma_table_info(?) WHERE name=?`
	var count int
	err := DB.QueryRow(query, tableName, columnName).Scan(&count)
	if err != nil {
		return false
	}
	return count > 0
}

func InitDB() {
	var err error
	utils.PathExistsOrCreate("./data")
	utils.PathExistsOrCreate("./data/background-cache")

	dbPath := filepath.Join("./data", "nav.db")
	dbPath += "?_journal=WAL&_timeout=5000&_busy_timeout=5000&_txlock=immediate"

	DB, err = sql.Open("sqlite", dbPath)
	utils.CheckErr(err)

	createBaseTables()
	runColumnUpgrades()
	utils.CheckErr(runMigrations())
	ensureCategoryTable()
	createAdditionalTables()
	runAdditionalColumnUpgrades()
	seedDefaultData()

	logger.LogInfo("数据库初始化成功")
	cleanupEmptyCategories()
}

func createBaseTables() {
	baseTables := []string{
		`
		CREATE TABLE IF NOT EXISTS nav_user (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT,
			password TEXT
		);
		`,
		`
		CREATE TABLE IF NOT EXISTS nav_setting (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
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
			enableBackground BOOLEAN NOT NULL DEFAULT 0,
			enableSurfaceEffects BOOLEAN NOT NULL DEFAULT 0,
			pexelsApiKey TEXT,
			proxy TEXT DEFAULT ''
		);
		`,
		`
		CREATE TABLE IF NOT EXISTS nav_table (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT,
			url TEXT,
			logo TEXT,
			category TEXT,
			description TEXT
		);
		`,
	}

	for _, stmt := range baseTables {
		_, err := DB.Exec(stmt)
		utils.CheckErr(err)
	}

}

func ensureCategoryTable() {
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS nav_category (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT,
			sort INTEGER NOT NULL DEFAULT 0,
			hide BOOLEAN
		);
	`)
	utils.CheckErr(err)
}

func runColumnUpgrades() {
	upgradeStatements := []struct {
		table   string
		column  string
		sqlStmt string
	}{
		{"nav_setting", "logo192", `ALTER TABLE nav_setting ADD COLUMN logo192 TEXT;`},
		{"nav_setting", "logo512", `ALTER TABLE nav_setting ADD COLUMN logo512 TEXT;`},
		{"nav_setting", "govRecord", `ALTER TABLE nav_setting ADD COLUMN govRecord TEXT;`},
		{"nav_setting", "jumpTargetBlank", `ALTER TABLE nav_setting ADD COLUMN jumpTargetBlank BOOLEAN;`},
		{"nav_setting", "hideAdmin", `ALTER TABLE nav_setting ADD COLUMN hideAdmin BOOLEAN;`},
		{"nav_setting", "hideGithub", `ALTER TABLE nav_setting ADD COLUMN hideGithub BOOLEAN;`},
		{"nav_setting", "hideToggleJumpTarget", `ALTER TABLE nav_setting ADD COLUMN hideToggleJumpTarget BOOLEAN;`},
		{"nav_table", "sort", `ALTER TABLE nav_table ADD COLUMN sort INTEGER;`},
		{"nav_table", "hide", `ALTER TABLE nav_table ADD COLUMN hide BOOLEAN;`},
		{"nav_table", "view_mode", `ALTER TABLE nav_table ADD COLUMN view_mode TEXT NOT NULL DEFAULT 'icon';`},
		{"nav_table", "type", `ALTER TABLE nav_table ADD COLUMN type TEXT NOT NULL DEFAULT 'icon';`},
		{"nav_table", "parent_id", `ALTER TABLE nav_table ADD COLUMN parent_id INTEGER NULL;`},
		{"nav_table", "size", `ALTER TABLE nav_table ADD COLUMN size TEXT NOT NULL DEFAULT '1x1';`},
		{"nav_table", "folder_tint", `ALTER TABLE nav_table ADD COLUMN folder_tint TEXT NULL;`},
		{"nav_table", "grid_x", `ALTER TABLE nav_table ADD COLUMN grid_x INTEGER NOT NULL DEFAULT -1;`},
		{"nav_table", "grid_y", `ALTER TABLE nav_table ADD COLUMN grid_y INTEGER NOT NULL DEFAULT -1;`},
		{"nav_table", "folder_view_mode", `ALTER TABLE nav_table ADD COLUMN folder_view_mode TEXT NOT NULL DEFAULT 'grid';`},
		{"nav_table", "folder_item_size", `ALTER TABLE nav_table ADD COLUMN folder_item_size INTEGER NOT NULL DEFAULT 28;`},
		{"nav_table", "icon_status", `ALTER TABLE nav_table ADD COLUMN icon_status TEXT NOT NULL DEFAULT '';`},
		{"nav_table", "icon_error", `ALTER TABLE nav_table ADD COLUMN icon_error TEXT NOT NULL DEFAULT '';`},
		{"nav_table", "icon_updated_at", `ALTER TABLE nav_table ADD COLUMN icon_updated_at INTEGER NOT NULL DEFAULT 0;`},
	}

	for _, upgrade := range upgradeStatements {
		if !columnExists(upgrade.table, upgrade.column) {
			_, err := DB.Exec(upgrade.sqlStmt)
			utils.CheckErr(err)
		}
	}
}

func createAdditionalTables() {
	additionalTables := []string{
		`
		CREATE TABLE IF NOT EXISTS nav_api_token (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT,
			value TEXT,
			disabled INTEGER
		);
		`,
		`
		CREATE TABLE IF NOT EXISTS nav_img (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			url TEXT,
			value TEXT
		);
		`,
		`
		CREATE TABLE IF NOT EXISTS nav_search_engine (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			baseUrl TEXT NOT NULL,
			queryParam TEXT NOT NULL,
			logo TEXT,
			sort INTEGER NOT NULL DEFAULT 0,
			enabled BOOLEAN NOT NULL DEFAULT 1
		);
		`,
		`
		CREATE TABLE IF NOT EXISTS dock_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			tool_id INTEGER NOT NULL,
			sort INTEGER NOT NULL DEFAULT 0,
			FOREIGN KEY (tool_id) REFERENCES nav_table(id)
		);
		`,
		`
		CREATE TABLE IF NOT EXISTS nav_site_config (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			noImageMode BOOLEAN NOT NULL DEFAULT 0,
			compactMode BOOLEAN NOT NULL DEFAULT 0
		);
		`,
	}

	for _, stmt := range additionalTables {
		_, err := DB.Exec(stmt)
		utils.CheckErr(err)
	}
}

func runAdditionalColumnUpgrades() {
	upgradeStatements := []struct {
		table   string
		column  string
		sqlStmt string
	}{
		{"nav_site_config", "compactMode", `ALTER TABLE nav_site_config ADD COLUMN compactMode BOOLEAN NOT NULL DEFAULT 0;`},
		{"nav_site_config", "columnsPerRow", `ALTER TABLE nav_site_config ADD COLUMN columnsPerRow INTEGER NOT NULL DEFAULT 3;`},
		{"nav_site_config", "iconSize", `ALTER TABLE nav_site_config ADD COLUMN iconSize INTEGER NOT NULL DEFAULT 0;`},
		{"nav_site_config", "density", `ALTER TABLE nav_site_config ADD COLUMN density TEXT NOT NULL DEFAULT 'standard';`},
		{"nav_site_config", "folder_list_item_size", `ALTER TABLE nav_site_config ADD COLUMN folder_list_item_size INTEGER NOT NULL DEFAULT 28;`},
		{"nav_setting", "backgroundUrl", `ALTER TABLE nav_setting ADD COLUMN backgroundUrl TEXT;`},
		{"nav_setting", "enableBackground", `ALTER TABLE nav_setting ADD COLUMN enableBackground BOOLEAN NOT NULL DEFAULT 0;`},
		{"nav_setting", "enableSurfaceEffects", `ALTER TABLE nav_setting ADD COLUMN enableSurfaceEffects BOOLEAN NOT NULL DEFAULT 0;`},
		{"nav_setting", "pexelsApiKey", `ALTER TABLE nav_setting ADD COLUMN pexelsApiKey TEXT;`},
		{"nav_setting", "proxy", `ALTER TABLE nav_setting ADD COLUMN proxy TEXT DEFAULT '';`},
	}

	for _, upgrade := range upgradeStatements {
		if !columnExists(upgrade.table, upgrade.column) {
			_, err := DB.Exec(upgrade.sqlStmt)
			utils.CheckErr(err)
		}
	}
}

func seedDefaultData() {
	sqlGetSearchEngine := `SELECT COUNT(*) FROM nav_search_engine;`
	var searchEngineCount int
	err := DB.QueryRow(sqlGetSearchEngine).Scan(&searchEngineCount)
	utils.CheckErr(err)

	if searchEngineCount == 0 {
		defaultEngines := []struct {
			name       string
			baseURL    string
			queryParam string
			logo       string
			sort       int
		}{
			{"百度", "https://www.baidu.com/s", "wd", "baidu.ico", 1},
			{"Bing", "https://cn.bing.com/search", "q", "bing.ico", 2},
			{"Google", "https://www.google.com/search", "q", "google.ico", 3},
		}

		stmt, err := DB.Prepare(`
			INSERT INTO nav_search_engine (name, baseUrl, queryParam, logo, sort, enabled)
			VALUES (?, ?, ?, ?, ?, ?);
		`)
		utils.CheckErr(err)
		defer stmt.Close()

		for _, engine := range defaultEngines {
			_, err = stmt.Exec(engine.name, engine.baseURL, engine.queryParam, engine.logo, engine.sort, true)
			utils.CheckErr(err)
		}
		logger.LogInfo("默认搜索引擎初始化成功")
	}

	rows, err := DB.Query(`SELECT * FROM nav_user;`)
	utils.CheckErr(err)
	if !rows.Next() {
		stmt, err := DB.Prepare(`
			INSERT INTO nav_user (id, name, password)
			VALUES (?, ?, ?);
		`)
		utils.CheckErr(err)
		res, err := stmt.Exec(utils.GenerateId(), "admin", "admin")
		utils.CheckErr(err)
		_, err = res.LastInsertId()
		utils.CheckErr(err)
	}
	rows.Close()

	rows, err = DB.Query(`SELECT * FROM nav_setting;`)
	utils.CheckErr(err)
	if !rows.Next() {
		stmt, err := DB.Prepare(`
			INSERT INTO nav_setting (favicon, title, govRecord, logo192, logo512, hideAdmin, hideGithub, hideToggleJumpTarget, jumpTargetBlank)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
		`)
		utils.CheckErr(err)
		res, err := stmt.Exec("favicon.ico", "Van Nav", "", "logo192.png", "logo512.png", false, false, false, true)
		utils.CheckErr(err)
		_, err = res.LastInsertId()
		utils.CheckErr(err)
	}
	rows.Close()

	rows, err = DB.Query(`SELECT * FROM nav_site_config;`)
	utils.CheckErr(err)
	if !rows.Next() {
		stmt, err := DB.Prepare(`
			INSERT INTO nav_site_config (noImageMode, compactMode)
			VALUES (?, ?);
		`)
		utils.CheckErr(err)
		res, err := stmt.Exec(false, false)
		utils.CheckErr(err)
		_, err = res.LastInsertId()
		utils.CheckErr(err)
	}
	rows.Close()

	var toolsCount int
	err = DB.QueryRow(`SELECT COUNT(*) FROM nav_table;`).Scan(&toolsCount)
	utils.CheckErr(err)
	if toolsCount == 0 {
		initSeedData()
	}
}

func cleanupEmptyCategories() {
	result, err := DB.Exec(`
		DELETE FROM nav_category
		WHERE name IS NULL OR name = '' OR TRIM(name) = '';
	`)
	if err != nil {
		logger.LogInfo("清理空分类记录时出错: %v", err)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err == nil && rowsAffected > 0 {
		logger.LogInfo("已清理 %d 条空分类记录", rowsAffected)
	}
}

func initSeedData() {
	folders := []struct {
		name        string
		url         string
		logo        string
		category    string
		description string
		sort        int
		viewMode    string
		typeValue   string
		size        string
		folderTint  string
	}{
		{"常用工具", "", "", "", "常用开发工具", 1, "icon", "folder", "1x1", ""},
		{"学习资源", "", "", "", "技术学习资源", 2, "icon", "folder", "1x1", ""},
		{"社交媒体", "", "", "", "社交和媒体", 3, "icon", "folder", "1x1", ""},
	}

	sqlAddFolder := `
		INSERT INTO nav_table (name, url, logo, category, description, sort, hide, view_mode, type, parent_id, size, folder_tint, grid_x, grid_y, folder_view_mode, folder_item_size)
		VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, NULL, ?, ?, -1, -1, 'grid', 28);
	`
	for _, folder := range folders {
		_, err := DB.Exec(sqlAddFolder, folder.name, folder.url, folder.logo, folder.category, folder.description, folder.sort, folder.viewMode, folder.typeValue, folder.size, folder.folderTint)
		utils.CheckErr(err)
	}

	var folder1ID, folder2ID, folder3ID int
	DB.QueryRow("SELECT id FROM nav_table WHERE name='常用工具' AND type='folder'").Scan(&folder1ID)
	DB.QueryRow("SELECT id FROM nav_table WHERE name='学习资源' AND type='folder'").Scan(&folder2ID)
	DB.QueryRow("SELECT id FROM nav_table WHERE name='社交媒体' AND type='folder'").Scan(&folder3ID)

	type seedTool struct {
		name        string
		url         string
		logo        string
		category    string
		description string
		sort        int
		viewMode    string
		typeValue   string
		parentID    *int
		size        string
		folderTint  string
	}

	tools := []seedTool{
		{"GitHub", "https://github.com", "github.ico", "", "代码托管平台", 1, "icon", "icon", &folder1ID, "1x1", ""},
		{"Google", "https://google.com", "google.ico", "", "搜索引擎", 2, "icon", "icon", &folder1ID, "1x1", ""},
		{"Stack Overflow", "https://stackoverflow.com", "stackoverflow.ico", "", "技术问答社区", 3, "icon", "icon", &folder1ID, "1x1", ""},
		{"MDN", "https://developer.mozilla.org", "mdn.ico", "", "Web 开发文档", 4, "icon", "icon", &folder2ID, "1x1", ""},
		{"TypeScript Docs", "https://www.typescriptlang.org/docs", "typescript.ico", "", "TypeScript 官方文档", 5, "icon", "icon", &folder2ID, "1x1", ""},
		{"React Docs", "https://react.dev", "react.ico", "", "React 官方文档", 6, "icon", "icon", &folder2ID, "1x1", ""},
		{"Twitter/X", "https://x.com", "twitter.ico", "", "社交平台", 7, "icon", "icon", &folder3ID, "1x1", ""},
		{"Reddit", "https://reddit.com", "reddit.ico", "", "社区论坛", 8, "icon", "icon", &folder3ID, "1x1", ""},
		{"YouTube", "https://youtube.com", "youtube.ico", "", "视频平台", 9, "icon", "icon", &folder3ID, "1x1", ""},
		{"Gmail", "https://mail.google.com", "gmail.ico", "", "Google 邮箱", 10, "icon", "icon", nil, "1x1", ""},
		{"Notion", "https://notion.so", "notion.ico", "", "笔记和协作工具", 11, "icon", "icon", nil, "1x1", ""},
	}

	sqlAddTool := `
		INSERT INTO nav_table (name, url, logo, category, description, sort, hide, view_mode, type, parent_id, size, folder_tint, grid_x, grid_y, folder_view_mode, folder_item_size)
		VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, -1, -1, 'grid', 28);
	`
	for _, tool := range tools {
		_, err := DB.Exec(sqlAddTool, tool.name, tool.url, tool.logo, tool.category, tool.description, tool.sort, tool.viewMode, tool.typeValue, tool.parentID, tool.size, tool.folderTint)
		utils.CheckErr(err)
	}

	logger.LogInfo("测试数据初始化成功")
}
