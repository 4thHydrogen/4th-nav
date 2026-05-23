package repository

import (
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
	_ "modernc.org/sqlite"
)

func setupRepositoryTestDB(t *testing.T) *sql.DB {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "repo-test.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	stmts := []string{
		`CREATE TABLE nav_table (
			id INTEGER PRIMARY KEY,
			parent_id INTEGER NULL,
			folder_view_mode TEXT NOT NULL DEFAULT 'grid',
			folder_item_size INTEGER NOT NULL DEFAULT 28,
			grid_x INTEGER NOT NULL DEFAULT -1,
			grid_y INTEGER NOT NULL DEFAULT -1
		);`,
		`CREATE TABLE dock_items (
			id INTEGER PRIMARY KEY,
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

func TestUpdateFolderSettings(t *testing.T) {
	db := setupRepositoryTestDB(t)
	if _, err := db.Exec(`INSERT INTO nav_table (id, folder_view_mode, folder_item_size) VALUES (1, 'grid', 28)`); err != nil {
		t.Fatalf("seed folder: %v", err)
	}

	if err := UpdateFolderSettings(1, "list", 40); err != nil {
		t.Fatalf("update settings: %v", err)
	}

	var mode string
	var size int
	if err := db.QueryRow(`SELECT folder_view_mode, folder_item_size FROM nav_table WHERE id = 1`).Scan(&mode, &size); err != nil {
		t.Fatalf("load folder: %v", err)
	}

	if mode != "list" || size != 40 {
		t.Fatalf("unexpected settings: got (%s, %d)", mode, size)
	}
}

func TestMoveToolToFolder(t *testing.T) {
	db := setupRepositoryTestDB(t)
	if _, err := db.Exec(`INSERT INTO nav_table (id, parent_id) VALUES (1, NULL)`); err != nil {
		t.Fatalf("seed tool: %v", err)
	}

	parentID := 42
	if err := MoveToolToFolder(1, &parentID); err != nil {
		t.Fatalf("move to folder: %v", err)
	}

	var got sql.NullInt64
	if err := db.QueryRow(`SELECT parent_id FROM nav_table WHERE id = 1`).Scan(&got); err != nil {
		t.Fatalf("load tool: %v", err)
	}
	if !got.Valid || got.Int64 != 42 {
		t.Fatalf("unexpected parent after move: %+v", got)
	}

	if err := MoveToolToFolder(1, nil); err != nil {
		t.Fatalf("move out of folder: %v", err)
	}

	if err := db.QueryRow(`SELECT parent_id FROM nav_table WHERE id = 1`).Scan(&got); err != nil {
		t.Fatalf("load tool after clear: %v", err)
	}
	if got.Valid {
		t.Fatalf("expected null parent after clear, got %+v", got)
	}
}

func TestCountChildren(t *testing.T) {
	db := setupRepositoryTestDB(t)
	if _, err := db.Exec(`INSERT INTO nav_table (id, parent_id) VALUES (10, NULL), (11, 10), (12, 10), (13, NULL)`); err != nil {
		t.Fatalf("seed tools: %v", err)
	}

	count, err := CountChildren(10)
	if err != nil {
		t.Fatalf("count children: %v", err)
	}
	if count != 2 {
		t.Fatalf("expected 2 children, got %d", count)
	}
}

func TestDeleteFolderMoveChildrenToRoot(t *testing.T) {
	db := setupRepositoryTestDB(t)
	if _, err := db.Exec(`INSERT INTO nav_table (id, parent_id) VALUES (10, NULL), (11, 10), (12, 10)`); err != nil {
		t.Fatalf("seed folder tree: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO dock_items (id, tool_id, sort) VALUES (1, 10, 0)`); err != nil {
		t.Fatalf("seed dock: %v", err)
	}

	if err := DeleteFolder(10, "move-children-to-root"); err != nil {
		t.Fatalf("delete folder: %v", err)
	}

	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM nav_table WHERE id = 10`).Scan(&count); err != nil {
		t.Fatalf("count deleted folder: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected folder deleted, count=%d", count)
	}

	var parent11, parent12 sql.NullInt64
	if err := db.QueryRow(`SELECT parent_id FROM nav_table WHERE id = 11`).Scan(&parent11); err != nil {
		t.Fatalf("load child 11: %v", err)
	}
	if err := db.QueryRow(`SELECT parent_id FROM nav_table WHERE id = 12`).Scan(&parent12); err != nil {
		t.Fatalf("load child 12: %v", err)
	}
	if parent11.Valid || parent12.Valid {
		t.Fatalf("expected children moved to root, got parent11=%+v parent12=%+v", parent11, parent12)
	}
}

func TestUpdateLayout(t *testing.T) {
	db := setupRepositoryTestDB(t)
	if _, err := db.Exec(`INSERT INTO nav_table (id, grid_x, grid_y) VALUES (1, -1, -1), (2, -1, -1)`); err != nil {
		t.Fatalf("seed layout tools: %v", err)
	}

	err := UpdateLayout(types.UpdateLayoutDto{
		Items: []types.LayoutItemDto{
			{Id: 1, GridX: 2, GridY: 3},
			{Id: 2, GridX: 4, GridY: 5},
		},
	})
	if err != nil {
		t.Fatalf("update layout: %v", err)
	}

	var x1, y1, x2, y2 int
	if err := db.QueryRow(`SELECT grid_x, grid_y FROM nav_table WHERE id = 1`).Scan(&x1, &y1); err != nil {
		t.Fatalf("load item 1: %v", err)
	}
	if err := db.QueryRow(`SELECT grid_x, grid_y FROM nav_table WHERE id = 2`).Scan(&x2, &y2); err != nil {
		t.Fatalf("load item 2: %v", err)
	}
	if x1 != 2 || y1 != 3 || x2 != 4 || y2 != 5 {
		t.Fatalf("unexpected layout positions: got (1)%d,%d (2)%d,%d", x1, y1, x2, y2)
	}
}
