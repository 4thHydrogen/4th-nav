package repository

import (
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
	_ "modernc.org/sqlite"
)

func setupCategoryRepositoryTestDB(t *testing.T) *sql.DB {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "category-repo-test.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	stmts := []string{
		`CREATE TABLE nav_catelog (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT,
			sort INTEGER,
			hide BOOLEAN
		);`,
		`CREATE TABLE nav_table (
			id INTEGER PRIMARY KEY,
			catelog TEXT
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

func TestCategoryRepositoryLifecycle(t *testing.T) {
	db := setupCategoryRepositoryTestDB(t)
	if _, err := db.Exec(`
		INSERT INTO nav_catelog (id, name, sort, hide) VALUES (1, 'old', 1, 0);
		INSERT INTO nav_table (id, catelog) VALUES (10, 'old'), (11, 'old');
	`); err != nil {
		t.Fatalf("seed categories: %v", err)
	}

	if err := CreateCategory(types.AddCategoryDto{Name: "new", Sort: 2, Hide: true}); err != nil {
		t.Fatalf("create category: %v", err)
	}

	categories, err := GetAllCategories()
	if err != nil {
		t.Fatalf("get categories: %v", err)
	}
	if len(categories) != 2 {
		t.Fatalf("expected 2 categories, got %d", len(categories))
	}

	if err := UpdateCategory(types.UpdateCategoryDto{Id: 1, Name: "renamed", Sort: 3, Hide: true}); err != nil {
		t.Fatalf("update category: %v", err)
	}

	var toolCategory string
	if err := db.QueryRow(`SELECT catelog FROM nav_table WHERE id = 10`).Scan(&toolCategory); err != nil {
		t.Fatalf("load tool category: %v", err)
	}
	if toolCategory != "renamed" {
		t.Fatalf("expected tool category renamed, got %s", toolCategory)
	}

	if err := DeleteCategory(1); err != nil {
		t.Fatalf("delete category: %v", err)
	}

	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM nav_catelog WHERE id = 1`).Scan(&count); err != nil {
		t.Fatalf("count categories: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected category deleted, got count=%d", count)
	}
}
