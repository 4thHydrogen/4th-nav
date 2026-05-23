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
	// 创建数据库
	dir := "./data"
	dbPath := filepath.Join(dir, "nav.db")
	// 添加连接参数
	dbPath = dbPath + "?_journal=WAL&_timeout=5000&_busy_timeout=5000&_txlock=immediate"
	DB, err = sql.Open("sqlite", dbPath)
	utils.CheckErr(err)
	// user 表
	sql_create_table := `
		CREATE TABLE IF NOT EXISTS nav_user (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT,
			password TEXT
		);
		`
	_, err = DB.Exec(sql_create_table)
	utils.CheckErr(err)
	// setting 表
	sql_create_table = `
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
		jumpTargetBlank BOOLEAN
	);
	`
	_, err = DB.Exec(sql_create_table)
	utils.CheckErr(err)
	// 检查并添加列
	if !columnExists("nav_setting", "logo192") {
		DB.Exec(`ALTER TABLE nav_setting ADD COLUMN logo192 TEXT;`)
	}
	if !columnExists("nav_setting", "logo512") {
		DB.Exec(`ALTER TABLE nav_setting ADD COLUMN logo512 TEXT;`)
	}
	if !columnExists("nav_setting", "govRecord") {
		DB.Exec(`ALTER TABLE nav_setting ADD COLUMN govRecord TEXT;`)
	}
	if !columnExists("nav_setting", "jumpTargetBlank") {
		DB.Exec(`ALTER TABLE nav_setting ADD COLUMN jumpTargetBlank BOOLEAN;`)
	}
	// 设置表表结构升级-20230628
	if !columnExists("nav_setting", "hideAdmin") {
		DB.Exec(`ALTER TABLE nav_setting ADD COLUMN hideAdmin BOOLEAN;`)
	}
	// 设置表表结构升级-20230627
	if !columnExists("nav_setting", "hideGithub") {
		DB.Exec(`ALTER TABLE nav_setting ADD COLUMN hideGithub BOOLEAN;`)
	}
	// 设置表表结构升级-20250624
	if !columnExists("nav_setting", "hideToggleJumpTarget") {
		DB.Exec(`ALTER TABLE nav_setting ADD COLUMN hideToggleJumpTarget BOOLEAN;`)
	}

	// 默认 tools 用的 表
	sql_create_table = `
		CREATE TABLE IF NOT EXISTS nav_table (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT,
			url TEXT,
			logo TEXT,
			catelog TEXT,
			desc TEXT
		);
		`
	_, err = DB.Exec(sql_create_table)
	utils.CheckErr(err)

	// tools数据表结构升级-20230327
	if !columnExists("nav_table", "sort") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN sort INTEGER;`)
	}

	// tools数据表结构升级-20230627
	if !columnExists("nav_table", "hide") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN hide BOOLEAN;`)
	}

	// tools数据表结构升级 - 添加布局模式字段
	if !columnExists("nav_table", "view_mode") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN view_mode TEXT NOT NULL DEFAULT 'icon';`)
	}

	// tools数据表结构升级 - 文件夹功能
	if !columnExists("nav_table", "type") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN type TEXT NOT NULL DEFAULT 'icon';`)
	}
	if !columnExists("nav_table", "parent_id") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN parent_id INTEGER NULL;`)
	}
	if !columnExists("nav_table", "size") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN size TEXT NOT NULL DEFAULT '1x1';`)
	}
	if !columnExists("nav_table", "bg_color") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN bg_color TEXT NULL;`)
	}

	// 网格布局位置字段
	if !columnExists("nav_table", "grid_x") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN grid_x INTEGER NOT NULL DEFAULT -1;`)
	}
	if !columnExists("nav_table", "grid_y") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN grid_y INTEGER NOT NULL DEFAULT -1;`)
	}
	// 文件夹视图模式字段
	if !columnExists("nav_table", "folder_view_mode") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN folder_view_mode TEXT NOT NULL DEFAULT 'grid';`)
	}
	if !columnExists("nav_table", "folder_item_size") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN folder_item_size INTEGER NOT NULL DEFAULT 28;`)
	}
	// icon 状态字段
	if !columnExists("nav_table", "icon_status") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN icon_status TEXT NOT NULL DEFAULT '';`)
	}
	if !columnExists("nav_table", "icon_error") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN icon_error TEXT NOT NULL DEFAULT '';`)
	}
	if !columnExists("nav_table", "icon_updated_at") {
		DB.Exec(`ALTER TABLE nav_table ADD COLUMN icon_updated_at INTEGER NOT NULL DEFAULT 0;`)
	}

	// 分类表
	sql_create_table = `
		CREATE TABLE IF NOT EXISTS nav_catelog (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT
		);
			`
	_, err = DB.Exec(sql_create_table)
	utils.CheckErr(err)

	// 分类表表结构升级-20230327
	if !columnExists("nav_catelog", "sort") {
		DB.Exec(`ALTER TABLE nav_catelog ADD COLUMN sort INTEGER NOT NULL DEFAULT 0;`)
	}

	// 分类表表结构升级-20241219-【隐藏分类】
	if !columnExists("nav_catelog", "hide") {
		DB.Exec(`ALTER TABLE nav_catelog ADD COLUMN hide BOOLEAN;`)
	}
	runMigrations()

	// api token 表
	sql_create_table = `
		CREATE TABLE IF NOT EXISTS nav_api_token (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT,
			value TEXT,
			disabled INTEGER
		);
		`
	_, err = DB.Exec(sql_create_table)
	utils.CheckErr(err)
	// img 表
	sql_create_table = `
		CREATE TABLE IF NOT EXISTS nav_img (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			url TEXT,
			value TEXT
		);
		`
	_, err = DB.Exec(sql_create_table)
	utils.CheckErr(err)

	// 搜索引擎表
	sql_create_table = `
		CREATE TABLE IF NOT EXISTS nav_search_engine (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			baseUrl TEXT NOT NULL,
			queryParam TEXT NOT NULL,
			logo TEXT,
			sort INTEGER NOT NULL DEFAULT 0,
			enabled BOOLEAN NOT NULL DEFAULT 1
		);
		`
	_, err = DB.Exec(sql_create_table)
	utils.CheckErr(err)

	// Dock 栏表
	sql_create_table = `
		CREATE TABLE IF NOT EXISTS dock_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			tool_id INTEGER NOT NULL,
			sort INTEGER NOT NULL DEFAULT 0,
			FOREIGN KEY (tool_id) REFERENCES nav_table(id)
		);
		`
	_, err = DB.Exec(sql_create_table)
	utils.CheckErr(err)

	// 网站配置表
	sql_create_table = `
		CREATE TABLE IF NOT EXISTS nav_site_config (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			noImageMode BOOLEAN NOT NULL DEFAULT 0,
			compactMode BOOLEAN NOT NULL DEFAULT 0
		);
		`
	_, err = DB.Exec(sql_create_table)
	utils.CheckErr(err)

	// 网站配置表结构升级 - 添加compactMode列
	if !columnExists("nav_site_config", "compactMode") {
		DB.Exec(`ALTER TABLE nav_site_config ADD COLUMN compactMode BOOLEAN NOT NULL DEFAULT 0;`)
	}

	// 网站配置表结构升级 - 添加columnsPerRow列
	if !columnExists("nav_site_config", "columnsPerRow") {
		DB.Exec(`ALTER TABLE nav_site_config ADD COLUMN columnsPerRow INTEGER NOT NULL DEFAULT 3;`)
	}

	// 网站配置表结构升级 - 添加iconSize列
	if !columnExists("nav_site_config", "iconSize") {
		DB.Exec(`ALTER TABLE nav_site_config ADD COLUMN iconSize INTEGER NOT NULL DEFAULT 0;`)
	}

	// 网站配置表结构升级 - 添加density列
	if !columnExists("nav_site_config", "density") {
		DB.Exec(`ALTER TABLE nav_site_config ADD COLUMN density TEXT NOT NULL DEFAULT 'standard';`)
	}

	// 网站配置表结构升级 - 添加全局文件夹列表行高列
	if !columnExists("nav_site_config", "folder_list_item_size") {
		DB.Exec(`ALTER TABLE nav_site_config ADD COLUMN folder_list_item_size INTEGER NOT NULL DEFAULT 28;`)
	}

	// 设置表结构升级 - 添加背景图片和毛玻璃相关字段
	if !columnExists("nav_setting", "backgroundUrl") {
		DB.Exec(`ALTER TABLE nav_setting ADD COLUMN backgroundUrl TEXT;`)
	}
	if !columnExists("nav_setting", "enableBackground") {
		DB.Exec(`ALTER TABLE nav_setting ADD COLUMN enableBackground BOOLEAN NOT NULL DEFAULT 0;`)
	}
	if !columnExists("nav_setting", "enableGlassmorphism") {
		DB.Exec(`ALTER TABLE nav_setting ADD COLUMN enableGlassmorphism BOOLEAN NOT NULL DEFAULT 0;`)
	}
	// 设置表结构升级 - 添加 Pexels API Key
	if !columnExists("nav_setting", "pexelsApiKey") {
		DB.Exec(`ALTER TABLE nav_setting ADD COLUMN pexelsApiKey TEXT;`)
	}
	if !columnExists("nav_setting", "proxy") {
		DB.Exec(`ALTER TABLE nav_setting ADD COLUMN proxy TEXT DEFAULT '';`)
	}

	// 如果不存在，就初始化默认搜索引擎
	sql_get_search_engine := `
		SELECT COUNT(*) FROM nav_search_engine;
		`
	var searchEngineCount int
	err = DB.QueryRow(sql_get_search_engine).Scan(&searchEngineCount)
	utils.CheckErr(err)
	if searchEngineCount == 0 {
		// 初始化默认搜索引擎
		defaultEngines := []struct {
			name       string
			baseUrl    string
			queryParam string
			logo       string
			sort       int
		}{
			{"百度", "https://www.baidu.com/s", "wd", "baidu.ico", 1},
			{"Bing", "https://cn.bing.com/search", "q", "bing.ico", 2},
			{"Google", "https://www.google.com/search", "q", "google.ico", 3},
		}

		sql_add_search_engine := `
			INSERT INTO nav_search_engine (name, baseUrl, queryParam, logo, sort, enabled)
			VALUES (?, ?, ?, ?, ?, ?);
			`
		stmt, err := DB.Prepare(sql_add_search_engine)
		utils.CheckErr(err)
		defer stmt.Close()

		for _, engine := range defaultEngines {
			_, err = stmt.Exec(engine.name, engine.baseUrl, engine.queryParam, engine.logo, engine.sort, true)
			utils.CheckErr(err)
		}
		logger.LogInfo("默认搜索引擎初始化成功")
	}

	// 如果不存在，就初始化用户
	sql_get_user := `
		SELECT * FROM nav_user;
		`
	rows, err := DB.Query(sql_get_user)
	utils.CheckErr(err)
	if !rows.Next() {
		sql_add_user := `
			INSERT INTO nav_user (id, name, password)
			VALUES (?, ?, ?);
			`
		stmt, err := DB.Prepare(sql_add_user)
		utils.CheckErr(err)
		res, err := stmt.Exec(utils.GenerateId(), "admin", "admin")
		utils.CheckErr(err)
		_, err = res.LastInsertId()
		utils.CheckErr(err)
	}
	rows.Close()
	// 如果不存在设置，就初始化
	sql_get_setting := `
		SELECT * FROM nav_setting;
		`
	rows, err = DB.Query(sql_get_setting)
	utils.CheckErr(err)
	if !rows.Next() {
		sql_add_setting := `
			INSERT INTO nav_setting (favicon, title, govRecord, logo192, logo512, hideAdmin, hideGithub, hideToggleJumpTarget, jumpTargetBlank)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
			`
		stmt, err := DB.Prepare(sql_add_setting)
		utils.CheckErr(err)
		res, err := stmt.Exec("favicon.ico", "Van Nav", "", "logo192.png", "logo512.png", false, false, false, true)
		utils.CheckErr(err)
		_, err = res.LastInsertId()
		utils.CheckErr(err)
	}
	rows.Close()

	// 如果不存在网站配置，就初始化
	sql_get_site_config := `
		SELECT * FROM nav_site_config;
		`
	rows, err = DB.Query(sql_get_site_config)
	utils.CheckErr(err)
	if !rows.Next() {
		sql_add_site_config := `
			INSERT INTO nav_site_config (noImageMode, compactMode)
			VALUES (?, ?);
			`
		stmt, err := DB.Prepare(sql_add_site_config)
		utils.CheckErr(err)
		res, err := stmt.Exec(false, false)
		utils.CheckErr(err)
		_, err = res.LastInsertId()
		utils.CheckErr(err)
	}
	rows.Close()
	// 如果 nav_table 为空，初始化测试数据
	sql_get_tools_count := `SELECT COUNT(*) FROM nav_table;`
	var toolsCount int
	err = DB.QueryRow(sql_get_tools_count).Scan(&toolsCount)
	utils.CheckErr(err)
	if toolsCount == 0 {
		initSeedData()
	}
	logger.LogInfo("数据库初始化成功💗")

	// 清理空分类记录 - 删除名称为空或只包含空白字符的分类
	cleanupEmptyCategories()
}

// cleanupEmptyCategories 清理空分类记录
func cleanupEmptyCategories() {
	// 删除名称为空或只包含空白字符的分类记录
	sql_cleanup := `
		DELETE FROM nav_catelog 
		WHERE name IS NULL OR name = '' OR TRIM(name) = '';
	`
	result, err := DB.Exec(sql_cleanup)
	if err != nil {
		logger.LogInfo("清理空分类记录时出错: %v", err)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err == nil && rowsAffected > 0 {
		logger.LogInfo("已清理 %d 条空分类记录", rowsAffected)
	}
}

// initSeedData 在 nav_table 为空时插入测试数据
func initSeedData() {
	// 插入测试文件夹
	folders := []struct {
		name     string
		url      string
		logo     string
		catelog  string
		desc     string
		sort     int
		viewMode string
		type_    string
		size     string
		bgColor  string
	}{
		{"常用工具", "", "", "", "常用开发工具", 1, "icon", "folder", "1x1", ""},
		{"学习资源", "", "", "", "技术学习资源", 2, "icon", "folder", "1x1", ""},
		{"社交媒体", "", "", "", "社交和媒体", 3, "icon", "folder", "1x1", ""},
	}

	sql_add_folder := `
		INSERT INTO nav_table (name, url, logo, catelog, ` + "`desc`" + `, sort, hide, view_mode, type, parent_id, size, bg_color, grid_x, grid_y, folder_view_mode, folder_item_size)
		VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, NULL, ?, ?, -1, -1, 'grid', 28);
		`
	for i, f := range folders {
		_, err := DB.Exec(sql_add_folder, f.name, f.url, f.logo, f.catelog, f.desc, f.sort+i*0, f.viewMode, f.type_, f.size, f.bgColor)
		utils.CheckErr(err)
	}

	// 获取文件夹 ID
	var folder1ID, folder2ID, folder3ID int
	DB.QueryRow("SELECT id FROM nav_table WHERE name='常用工具' AND type='folder'").Scan(&folder1ID)
	DB.QueryRow("SELECT id FROM nav_table WHERE name='学习资源' AND type='folder'").Scan(&folder2ID)
	DB.QueryRow("SELECT id FROM nav_table WHERE name='社交媒体' AND type='folder'").Scan(&folder3ID)

	// 插入测试网页条目
	type seedTool struct {
		name     string
		url      string
		logo     string
		catelog  string
		desc     string
		sort     int
		viewMode string
		type_    string
		parentID *int
		size     string
		bgColor  string
	}

	tools := []seedTool{
		// 常用工具
		{"GitHub", "https://github.com", "github.ico", "", "代码托管平台", 1, "icon", "icon", &folder1ID, "1x1", ""},
		{"Google", "https://google.com", "google.ico", "", "搜索引擎", 2, "icon", "icon", &folder1ID, "1x1", ""},
		{"Stack Overflow", "https://stackoverflow.com", "stackoverflow.ico", "", "技术问答社区", 3, "icon", "icon", &folder1ID, "1x1", ""},
		// 学习资源
		{"MDN", "https://developer.mozilla.org", "mdn.ico", "", "Web 开发文档", 4, "icon", "icon", &folder2ID, "1x1", ""},
		{"TypeScript Docs", "https://www.typescriptlang.org/docs", "typescript.ico", "", "TypeScript 官方文档", 5, "icon", "icon", &folder2ID, "1x1", ""},
		{"React Docs", "https://react.dev", "react.ico", "", "React 官方文档", 6, "icon", "icon", &folder2ID, "1x1", ""},
		// 社交媒体
		{"Twitter/X", "https://x.com", "twitter.ico", "", "社交平台", 7, "icon", "icon", &folder3ID, "1x1", ""},
		{"Reddit", "https://reddit.com", "reddit.ico", "", "社区论坛", 8, "icon", "icon", &folder3ID, "1x1", ""},
		{"YouTube", "https://youtube.com", "youtube.ico", "", "视频平台", 9, "icon", "icon", &folder3ID, "1x1", ""},
		// 独立条目
		{"Gmail", "https://mail.google.com", "gmail.ico", "", "Google 邮箱", 10, "icon", "icon", nil, "1x1", ""},
		{"Notion", "https://notion.so", "notion.ico", "", "笔记和协作工具", 11, "icon", "icon", nil, "1x1", ""},
	}

	sql_add_tool := `
		INSERT INTO nav_table (name, url, logo, catelog, ` + "`desc`" + `, sort, hide, view_mode, type, parent_id, size, bg_color, grid_x, grid_y, folder_view_mode, folder_item_size)
		VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, -1, -1, 'grid', 28);
		`
	for _, t := range tools {
		_, err := DB.Exec(sql_add_tool, t.name, t.url, t.logo, t.catelog, t.desc, t.sort, t.viewMode, t.type_, t.parentID, t.size, t.bgColor)
		utils.CheckErr(err)
	}

	logger.LogInfo("测试数据初始化成功")
}
