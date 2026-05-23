package repository

import (
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/4thHydrogen/4th-nav/database"
	_ "modernc.org/sqlite"
)

func setupIconRepositoryTestDB(t *testing.T) {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "icon-repo-test.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	stmts := []string{
		`CREATE TABLE nav_table (
			id INTEGER PRIMARY KEY,
			icon_status TEXT,
			icon_error TEXT,
			icon_updated_at INTEGER
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
}

func TestUpdateIconStatus(t *testing.T) {
	setupIconRepositoryTestDB(t)
	if _, err := database.DB.Exec(`INSERT INTO nav_table (id, icon_status, icon_error, icon_updated_at) VALUES (3, '', '', 0)`); err != nil {
		t.Fatalf("seed tool: %v", err)
	}

	if err := UpdateIconStatus(3, "failed", "boom"); err != nil {
		t.Fatalf("update icon status: %v", err)
	}

	var status, errMsg string
	var updatedAt int64
	if err := database.DB.QueryRow(`SELECT icon_status, icon_error, icon_updated_at FROM nav_table WHERE id = 3`).Scan(&status, &errMsg, &updatedAt); err != nil {
		t.Fatalf("load icon status: %v", err)
	}
	if status != "failed" || errMsg != "boom" || updatedAt == 0 {
		t.Fatalf("unexpected status row: %s %s %d", status, errMsg, updatedAt)
	}
}

func TestGetImageByURL(t *testing.T) {
	setupIconRepositoryTestDB(t)
	if _, err := database.DB.Exec(`INSERT INTO nav_img (url, value) VALUES ('https%3A%2F%2Fexample.com%2Flogo.png', 'base64-value')`); err != nil {
		t.Fatalf("seed image: %v", err)
	}

	img, ok, err := GetImageByURL("https://example.com/logo.png")
	if err != nil {
		t.Fatalf("get image by url: %v", err)
	}
	if !ok {
		t.Fatalf("expected image to exist")
	}
	if img.Value != "base64-value" {
		t.Fatalf("unexpected image payload: %+v", img)
	}
}

func TestSaveImageSkipsExistingRows(t *testing.T) {
	setupIconRepositoryTestDB(t)
	if err := SaveImage("https://example.com/logo.png", "first"); err != nil {
		t.Fatalf("save first image: %v", err)
	}
	if err := SaveImage("https://example.com/logo.png", "second"); err != nil {
		t.Fatalf("save duplicate image: %v", err)
	}

	var count int
	var value string
	if err := database.DB.QueryRow(`SELECT COUNT(*), MIN(value) FROM nav_img WHERE url = 'https%3A%2F%2Fexample.com%2Flogo.png'`).Scan(&count, &value); err != nil {
		t.Fatalf("count images: %v", err)
	}
	if count != 1 || value != "first" {
		t.Fatalf("unexpected stored images: count=%d value=%s", count, value)
	}
}
