package repository

import (
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
	_ "modernc.org/sqlite"
)

func setupDockRepositoryTestDB(t *testing.T) *sql.DB {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "dock-repo-test.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	stmts := []string{
		`CREATE TABLE nav_table (
			id INTEGER PRIMARY KEY,
			name TEXT,
			url TEXT,
			logo TEXT,
			catelog TEXT,
			"desc" TEXT
		);`,
		`CREATE TABLE dock_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			tool_id INTEGER NOT NULL,
			sort INTEGER NOT NULL DEFAULT 0
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

func TestGetDockItems(t *testing.T) {
	db := setupDockRepositoryTestDB(t)
	if _, err := db.Exec(`
		INSERT INTO nav_table (id, name, url, logo, catelog, "desc") VALUES
			(1, 'Tool 1', 'https://1.example', 'logo-1', 'dev', 'desc-1'),
			(2, 'Tool 2', 'https://2.example', 'logo-2', 'ops', 'desc-2');
	`); err != nil {
		t.Fatalf("seed tools: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO dock_items (tool_id, sort) VALUES (2, 2), (1, 1)`); err != nil {
		t.Fatalf("seed dock items: %v", err)
	}

	items, err := GetDockItems()
	if err != nil {
		t.Fatalf("get dock items: %v", err)
	}
	if len(items) != 2 {
		t.Fatalf("expected 2 dock items, got %d", len(items))
	}
	if items[0].ToolID != 1 || items[1].ToolID != 2 {
		t.Fatalf("unexpected item order: %+v", items)
	}
}

func TestAddDockItem(t *testing.T) {
	db := setupDockRepositoryTestDB(t)
	if _, err := db.Exec(`INSERT INTO nav_table (id, name) VALUES (9, 'Tool 9')`); err != nil {
		t.Fatalf("seed tool: %v", err)
	}

	if err := AddDockItem(9); err != nil {
		t.Fatalf("add dock item: %v", err)
	}

	var count, sort int
	if err := db.QueryRow(`SELECT COUNT(*), MAX(sort) FROM dock_items WHERE tool_id = 9`).Scan(&count, &sort); err != nil {
		t.Fatalf("load dock item: %v", err)
	}
	if count != 1 || sort != 0 {
		t.Fatalf("unexpected dock item state: count=%d sort=%d", count, sort)
	}
}

func TestRemoveDockItem(t *testing.T) {
	db := setupDockRepositoryTestDB(t)
	if _, err := db.Exec(`INSERT INTO dock_items (id, tool_id, sort) VALUES (5, 10, 0)`); err != nil {
		t.Fatalf("seed dock item: %v", err)
	}

	if err := RemoveDockItem(5); err != nil {
		t.Fatalf("remove dock item: %v", err)
	}

	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM dock_items WHERE id = 5`).Scan(&count); err != nil {
		t.Fatalf("count dock items: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected dock item deleted, got count=%d", count)
	}
}

func TestUpdateDockSort(t *testing.T) {
	db := setupDockRepositoryTestDB(t)
	if _, err := db.Exec(`INSERT INTO dock_items (id, tool_id, sort) VALUES (1, 10, 0), (2, 11, 1)`); err != nil {
		t.Fatalf("seed dock items: %v", err)
	}

	err := UpdateDockSort([]types.UpdateDockSortDto{
		{ID: 1, Sort: 10},
		{ID: 2, Sort: 20},
	})
	if err != nil {
		t.Fatalf("update dock sort: %v", err)
	}

	var sort1, sort2 int
	if err := db.QueryRow(`SELECT sort FROM dock_items WHERE id = 1`).Scan(&sort1); err != nil {
		t.Fatalf("load sort1: %v", err)
	}
	if err := db.QueryRow(`SELECT sort FROM dock_items WHERE id = 2`).Scan(&sort2); err != nil {
		t.Fatalf("load sort2: %v", err)
	}
	if sort1 != 10 || sort2 != 20 {
		t.Fatalf("unexpected sort values: %d %d", sort1, sort2)
	}
}
