package repository

import (
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
	_ "modernc.org/sqlite"
)

func setupToolRepositoryTestDB(t *testing.T) {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "tool-repo-test.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	stmts := []string{
		`CREATE TABLE nav_table (
			id INTEGER PRIMARY KEY,
			logo TEXT,
			sort INTEGER NOT NULL DEFAULT 0,
			view_mode TEXT NOT NULL DEFAULT 'icon'
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
}

func TestGetToolLogoURLByID(t *testing.T) {
	setupToolRepositoryTestDB(t)
	if _, err := database.DB.Exec(`INSERT INTO nav_table (id, logo) VALUES (1, 'https://example.com/logo.png')`); err != nil {
		t.Fatalf("seed tool: %v", err)
	}

	got, err := GetToolLogoURLByID(1)
	if err != nil {
		t.Fatalf("get logo url: %v", err)
	}
	if got != "https://example.com/logo.png" {
		t.Fatalf("unexpected logo url: %s", got)
	}
}

func TestUpdateToolViewMode(t *testing.T) {
	setupToolRepositoryTestDB(t)
	if _, err := database.DB.Exec(`INSERT INTO nav_table (id, view_mode) VALUES (1, 'icon')`); err != nil {
		t.Fatalf("seed tool: %v", err)
	}

	if err := UpdateToolViewMode(1, "card"); err != nil {
		t.Fatalf("update view mode: %v", err)
	}

	var got string
	if err := database.DB.QueryRow(`SELECT view_mode FROM nav_table WHERE id = 1`).Scan(&got); err != nil {
		t.Fatalf("load tool: %v", err)
	}
	if got != "card" {
		t.Fatalf("unexpected view mode: %s", got)
	}
}

func TestUpdateToolsSort(t *testing.T) {
	setupToolRepositoryTestDB(t)
	if _, err := database.DB.Exec(`INSERT INTO nav_table (id, sort) VALUES (1, 0), (2, 0)`); err != nil {
		t.Fatalf("seed tools: %v", err)
	}

	err := UpdateToolsSort([]types.UpdateToolsSortDto{
		{Id: 1, Sort: 10},
		{Id: 2, Sort: 20},
	})
	if err != nil {
		t.Fatalf("update sorts: %v", err)
	}

	var sort1, sort2 int
	if err := database.DB.QueryRow(`SELECT sort FROM nav_table WHERE id = 1`).Scan(&sort1); err != nil {
		t.Fatalf("load tool 1: %v", err)
	}
	if err := database.DB.QueryRow(`SELECT sort FROM nav_table WHERE id = 2`).Scan(&sort2); err != nil {
		t.Fatalf("load tool 2: %v", err)
	}
	if sort1 != 10 || sort2 != 20 {
		t.Fatalf("unexpected sorts: %d, %d", sort1, sort2)
	}
}

func TestGetAllToolsNormalizesStoredValues(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "tool-read-test.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	_, err = db.Exec(`CREATE TABLE nav_table (
		id INTEGER PRIMARY KEY,
		name TEXT,
		url TEXT,
		logo TEXT,
		catelog TEXT,
		"desc" TEXT,
		sort INTEGER,
		hide BOOLEAN,
		view_mode TEXT,
		type TEXT,
		parent_id INTEGER,
		size TEXT,
		bg_color TEXT,
		grid_x INTEGER,
		grid_y INTEGER,
		folder_view_mode TEXT,
		folder_item_size INTEGER
	);`)
	if err != nil {
		t.Fatalf("create schema: %v", err)
	}

	database.DB = db
	t.Cleanup(func() {
		_ = db.Close()
	})

	_, err = db.Exec(`INSERT INTO nav_table (
		id, name, url, logo, catelog, "desc", sort, hide, view_mode, type, parent_id, size, bg_color, grid_x, grid_y, folder_view_mode, folder_item_size
	) VALUES
		(1, 'Tool A', 'https://a.example', 'logo-a', 'dev', 'desc-a', NULL, NULL, '', '', NULL, '', NULL, NULL, NULL, '', NULL),
		(2, 'Folder B', 'https://b.example', 'logo-b', 'ops', 'desc-b', 7, 1, 'card', 'folder', 1, '2x2', '#fff', 3, 4, 'list', 36)
	`)
	if err != nil {
		t.Fatalf("seed tools: %v", err)
	}

	tools, err := GetAllTools()
	if err != nil {
		t.Fatalf("get all tools: %v", err)
	}
	if len(tools) != 2 {
		t.Fatalf("expected 2 tools, got %d", len(tools))
	}

	if tools[0].Sort != 0 || tools[0].Hide || tools[0].ViewMode != "icon" || tools[0].Type != "icon" {
		t.Fatalf("tool 0 normalization mismatch: %+v", tools[0])
	}
	if tools[0].Size != "1x1" || tools[0].BgColor != "" || tools[0].GridX != -1 || tools[0].GridY != -1 {
		t.Fatalf("tool 0 default fields mismatch: %+v", tools[0])
	}
	if tools[0].FolderViewMode != "grid" || tools[0].FolderItemSize != 28 {
		t.Fatalf("tool 0 folder defaults mismatch: %+v", tools[0])
	}

	if tools[1].Sort != 7 || !tools[1].Hide || tools[1].ViewMode != "card" || tools[1].Type != "folder" {
		t.Fatalf("tool 1 persisted fields mismatch: %+v", tools[1])
	}
	if tools[1].ParentId == nil || *tools[1].ParentId != 1 {
		t.Fatalf("tool 1 parent mismatch: %+v", tools[1].ParentId)
	}
	if tools[1].Size != "2x2" || tools[1].BgColor != "#fff" || tools[1].GridX != 3 || tools[1].GridY != 4 {
		t.Fatalf("tool 1 layout mismatch: %+v", tools[1])
	}
	if tools[1].FolderViewMode != "list" || tools[1].FolderItemSize != 36 {
		t.Fatalf("tool 1 folder settings mismatch: %+v", tools[1])
	}
}

func TestGetToolByID(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "tool-by-id.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	_, err = db.Exec(`CREATE TABLE nav_table (
		id INTEGER PRIMARY KEY,
		name TEXT,
		url TEXT,
		logo TEXT,
		catelog TEXT,
		"desc" TEXT,
		sort INTEGER,
		hide BOOLEAN,
		view_mode TEXT,
		type TEXT,
		parent_id INTEGER,
		size TEXT,
		bg_color TEXT,
		grid_x INTEGER,
		grid_y INTEGER,
		folder_view_mode TEXT,
		folder_item_size INTEGER
	);`)
	if err != nil {
		t.Fatalf("create schema: %v", err)
	}

	database.DB = db
	t.Cleanup(func() {
		_ = db.Close()
	})

	_, err = db.Exec(`INSERT INTO nav_table (
		id, name, url, logo, catelog, "desc", sort, hide, view_mode, type, parent_id, size, bg_color, grid_x, grid_y, folder_view_mode, folder_item_size
	) VALUES (8, 'Tool 8', 'https://8.example', 'logo-8', 'dev', 'desc-8', 3, 0, 'card', 'icon', NULL, '1x1', '', 0, 1, 'grid', 28)`)
	if err != nil {
		t.Fatalf("seed tool: %v", err)
	}

	tool, err := GetToolByID(8)
	if err != nil {
		t.Fatalf("get tool by id: %v", err)
	}

	if tool.Id != 8 || tool.Name != "Tool 8" || tool.ViewMode != "card" || tool.GridX != 0 || tool.GridY != 1 {
		t.Fatalf("unexpected tool: %+v", tool)
	}
}

func TestUpdateToolLogoByID(t *testing.T) {
	setupToolRepositoryTestDB(t)
	if _, err := database.DB.Exec(`INSERT INTO nav_table (id, logo) VALUES (1, 'old-logo')`); err != nil {
		t.Fatalf("seed tool: %v", err)
	}

	if err := UpdateToolLogoByID(1, "new-logo"); err != nil {
		t.Fatalf("update logo: %v", err)
	}

	var got string
	if err := database.DB.QueryRow(`SELECT logo FROM nav_table WHERE id = 1`).Scan(&got); err != nil {
		t.Fatalf("load logo: %v", err)
	}
	if got != "new-logo" {
		t.Fatalf("unexpected logo value: %s", got)
	}
}

func TestCreateToolNormalizesPersistedFields(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "tool-create.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	_, err = db.Exec(`CREATE TABLE nav_table (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		url TEXT,
		logo TEXT,
		catelog TEXT,
		"desc" TEXT,
		sort INTEGER,
		hide BOOLEAN,
		view_mode TEXT,
		type TEXT,
		parent_id INTEGER,
		size TEXT,
		bg_color TEXT,
		grid_x INTEGER,
		grid_y INTEGER,
		folder_view_mode TEXT,
		folder_item_size INTEGER
	);`)
	if err != nil {
		t.Fatalf("create schema: %v", err)
	}

	database.DB = db
	t.Cleanup(func() {
		_ = db.Close()
	})

	id, err := CreateTool(types.AddToolDto{
		Name:           "Tool A",
		Url:            "https://example.com",
		Logo:           "logo-a",
		Catelog:        "dev",
		Desc:           "desc-a",
		Sort:           7,
		Hide:           true,
		ViewMode:       "unknown",
		Type:           "weird",
		Size:           "9x9",
		BgColor:        "#123",
		GridX:          -9,
		GridY:          3,
		FolderViewMode: "unknown",
		FolderItemSize: 90,
	})
	if err != nil {
		t.Fatalf("create tool: %v", err)
	}

	tool, err := GetToolByID(id)
	if err != nil {
		t.Fatalf("get created tool: %v", err)
	}

	if tool.Name != "Tool A" || tool.ViewMode != "icon" || tool.Type != "icon" {
		t.Fatalf("unexpected created tool fields: %+v", tool)
	}
	if tool.Size != "1x1" || tool.GridX != -1 || tool.GridY != 3 {
		t.Fatalf("unexpected created layout fields: %+v", tool)
	}
	if tool.FolderViewMode != "grid" || tool.FolderItemSize != 48 {
		t.Fatalf("unexpected created folder settings: %+v", tool)
	}
}

func TestImportToolPreservesProvidedIDAndNormalizesFields(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "tool-import.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	_, err = db.Exec(`CREATE TABLE nav_table (
		id INTEGER PRIMARY KEY,
		name TEXT,
		url TEXT,
		logo TEXT,
		catelog TEXT,
		"desc" TEXT,
		sort INTEGER,
		hide BOOLEAN,
		view_mode TEXT,
		type TEXT,
		parent_id INTEGER,
		size TEXT,
		bg_color TEXT,
		grid_x INTEGER,
		grid_y INTEGER,
		folder_view_mode TEXT,
		folder_item_size INTEGER
	);`)
	if err != nil {
		t.Fatalf("create schema: %v", err)
	}

	database.DB = db
	t.Cleanup(func() {
		_ = db.Close()
	})

	if err := ImportTool(types.Tool{
		Id:             88,
		Name:           "Imported",
		Url:            "https://imported.example",
		Logo:           "logo-imported",
		Catelog:        "ops",
		Desc:           "imported-desc",
		Sort:           6,
		Hide:           true,
		ViewMode:       "bad",
		Type:           "weird",
		Size:           "9x9",
		GridX:          -3,
		GridY:          2,
		FolderViewMode: "bad",
		FolderItemSize: 5,
	}); err != nil {
		t.Fatalf("import tool: %v", err)
	}

	tool, err := GetToolByID(88)
	if err != nil {
		t.Fatalf("get imported tool: %v", err)
	}
	if tool.Id != 88 || tool.Name != "Imported" || tool.Sort != 6 || !tool.Hide {
		t.Fatalf("unexpected imported tool basics: %+v", tool)
	}
	if tool.ViewMode != "icon" || tool.Type != "icon" || tool.Size != "1x1" {
		t.Fatalf("unexpected imported tool normalization: %+v", tool)
	}
	if tool.GridX != -1 || tool.GridY != 2 || tool.FolderViewMode != "grid" || tool.FolderItemSize != 20 {
		t.Fatalf("unexpected imported tool layout: %+v", tool)
	}
}

func TestUpdateToolPersistsChanges(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "tool-update.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	_, err = db.Exec(`CREATE TABLE nav_table (
		id INTEGER PRIMARY KEY,
		name TEXT,
		url TEXT,
		logo TEXT,
		catelog TEXT,
		"desc" TEXT,
		sort INTEGER,
		hide BOOLEAN,
		view_mode TEXT,
		type TEXT,
		parent_id INTEGER,
		size TEXT,
		bg_color TEXT,
		grid_x INTEGER,
		grid_y INTEGER,
		folder_view_mode TEXT,
		folder_item_size INTEGER
	);`)
	if err != nil {
		t.Fatalf("create schema: %v", err)
	}

	database.DB = db
	t.Cleanup(func() {
		_ = db.Close()
	})

	if _, err := db.Exec(`INSERT INTO nav_table (
		id, name, url, logo, catelog, "desc", sort, hide, view_mode, type, parent_id, size, bg_color, grid_x, grid_y, folder_view_mode, folder_item_size
	) VALUES (5, 'Old', 'https://old.example', 'old-logo', 'ops', 'old-desc', 1, 0, 'icon', 'icon', NULL, '1x1', '', 4, 6, 'grid', 28)`); err != nil {
		t.Fatalf("seed tool: %v", err)
	}

	parentID := 11
	err = UpdateTool(types.UpdateToolDto{
		Id:             5,
		Name:           "New",
		Url:            "https://new.example",
		Logo:           "new-logo",
		Catelog:        "dev",
		Desc:           "new-desc",
		Sort:           9,
		Hide:           true,
		ViewMode:       "card",
		Type:           "folder",
		ParentId:       &parentID,
		Size:           "2x3",
		BgColor:        "#fff",
		GridX:          8,
		GridY:          10,
		FolderViewMode: "list",
		FolderItemSize: 18,
	})
	if err != nil {
		t.Fatalf("update tool: %v", err)
	}

	tool, err := GetToolByID(5)
	if err != nil {
		t.Fatalf("get updated tool: %v", err)
	}

	if tool.Name != "New" || tool.Url != "https://new.example" || tool.Logo != "new-logo" {
		t.Fatalf("unexpected basic fields: %+v", tool)
	}
	if !tool.Hide || tool.ViewMode != "card" || tool.Type != "folder" {
		t.Fatalf("unexpected state fields: %+v", tool)
	}
	if tool.ParentId == nil || *tool.ParentId != 11 || tool.Size != "2x3" || tool.BgColor != "#fff" {
		t.Fatalf("unexpected hierarchy fields: %+v", tool)
	}
	if tool.GridX != 8 || tool.GridY != 10 || tool.FolderViewMode != "list" || tool.FolderItemSize != 20 {
		t.Fatalf("unexpected layout fields: %+v", tool)
	}
}

func TestGetToolParentID(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "tool-parent.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	_, err = db.Exec(`CREATE TABLE nav_table (
		id INTEGER PRIMARY KEY,
		parent_id INTEGER NULL
	);`)
	if err != nil {
		t.Fatalf("create schema: %v", err)
	}

	database.DB = db
	t.Cleanup(func() {
		_ = db.Close()
	})

	if _, err := db.Exec(`INSERT INTO nav_table (id, parent_id) VALUES (1, NULL), (2, 99)`); err != nil {
		t.Fatalf("seed tools: %v", err)
	}

	parentID, err := GetToolParentID(1)
	if err != nil {
		t.Fatalf("get null parent: %v", err)
	}
	if parentID != nil {
		t.Fatalf("expected nil parent, got %+v", parentID)
	}

	parentID, err = GetToolParentID(2)
	if err != nil {
		t.Fatalf("get parent: %v", err)
	}
	if parentID == nil || *parentID != 99 {
		t.Fatalf("unexpected parent id: %+v", parentID)
	}
}

func TestGetToolTypeByID(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "tool-type.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	_, err = db.Exec(`CREATE TABLE nav_table (
		id INTEGER PRIMARY KEY,
		type TEXT
	);`)
	if err != nil {
		t.Fatalf("create schema: %v", err)
	}

	database.DB = db
	t.Cleanup(func() {
		_ = db.Close()
	})

	if _, err := db.Exec(`INSERT INTO nav_table (id, type) VALUES (3, 'folder')`); err != nil {
		t.Fatalf("seed tool: %v", err)
	}

	toolType, err := GetToolTypeByID(3)
	if err != nil {
		t.Fatalf("get tool type: %v", err)
	}
	if toolType != "folder" {
		t.Fatalf("unexpected tool type: %s", toolType)
	}
}

func TestDeleteToolCleansImageDockAndEmptyParent(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "tool-delete.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	stmts := []string{
		`CREATE TABLE nav_table (
			id INTEGER PRIMARY KEY,
			type TEXT,
			parent_id INTEGER NULL,
			logo TEXT
		);`,
		`CREATE TABLE dock_items (
			id INTEGER PRIMARY KEY,
			tool_id INTEGER NOT NULL,
			sort INTEGER NOT NULL DEFAULT 0
		);`,
		`CREATE TABLE nav_img (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			url TEXT,
			value TEXT
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

	if _, err := db.Exec(`
		INSERT INTO nav_table (id, type, parent_id, logo) VALUES
			(10, 'folder', NULL, ''),
			(11, 'icon', 10, 'https://example.com/logo.png');
	`); err != nil {
		t.Fatalf("seed tools: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO dock_items (id, tool_id, sort) VALUES (1, 10, 0), (2, 11, 1)`); err != nil {
		t.Fatalf("seed dock items: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO nav_img (url, value) VALUES ('https%3A%2F%2Fexample.com%2Flogo.png', 'base64')`); err != nil {
		t.Fatalf("seed image: %v", err)
	}

	if err := DeleteTool(11); err != nil {
		t.Fatalf("delete tool: %v", err)
	}

	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM nav_table WHERE id IN (10, 11)`).Scan(&count); err != nil {
		t.Fatalf("count remaining tools: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected tool and empty parent folder deleted, got count=%d", count)
	}

	if err := db.QueryRow(`SELECT COUNT(*) FROM dock_items`).Scan(&count); err != nil {
		t.Fatalf("count dock items: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected dock items cleaned up, got count=%d", count)
	}

	if err := db.QueryRow(`SELECT COUNT(*) FROM nav_img`).Scan(&count); err != nil {
		t.Fatalf("count images: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected image cache removed, got count=%d", count)
	}
}
