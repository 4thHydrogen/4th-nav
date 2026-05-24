package repository

import (
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
	_ "modernc.org/sqlite"
)

func setupSearchEngineRepositoryTestDB(t *testing.T) *sql.DB {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "search-engine-repo-test.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	if _, err := db.Exec(`
		CREATE TABLE nav_search_engine (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			baseUrl TEXT NOT NULL,
			queryParam TEXT NOT NULL,
			logo TEXT,
			sort INTEGER NOT NULL DEFAULT 0,
			enabled BOOLEAN NOT NULL DEFAULT 1
		);
	`); err != nil {
		t.Fatalf("create schema: %v", err)
	}

	database.DB = db
	t.Cleanup(func() {
		_ = db.Close()
	})
	return db
}

func TestSearchEngineRepositoryLifecycle(t *testing.T) {
	db := setupSearchEngineRepositoryTestDB(t)
	if _, err := db.Exec(`
		INSERT INTO nav_search_engine (id, name, baseUrl, queryParam, logo, sort, enabled) VALUES
			(1, 'Bing', 'https://bing.example', 'q', 'bing.ico', 2, 1),
			(2, 'Disabled', 'https://disabled.example', 'q', 'disabled.ico', 1, 0);
	`); err != nil {
		t.Fatalf("seed search engines: %v", err)
	}

	all, err := GetAllSearchEngines()
	if err != nil {
		t.Fatalf("get all search engines: %v", err)
	}
	if len(all) != 2 || all[0].Name != "Disabled" || all[1].Name != "Bing" {
		t.Fatalf("unexpected all search engines: %+v", all)
	}

	enabled, err := GetEnabledSearchEngines()
	if err != nil {
		t.Fatalf("get enabled search engines: %v", err)
	}
	if len(enabled) != 1 || enabled[0].Name != "Bing" {
		t.Fatalf("unexpected enabled search engines: %+v", enabled)
	}

	newID, err := AddSearchEngine(types.SearchEngine{
		Name:       "Google",
		BaseUrl:    "https://google.example",
		QueryParam: "q",
		Logo:       "google.ico",
		Enabled:    true,
	})
	if err != nil {
		t.Fatalf("add search engine: %v", err)
	}

	if err := UpdateSearchEngine(types.SearchEngine{
		Id:         int(newID),
		Name:       "Google CN",
		BaseUrl:    "https://google.cn",
		QueryParam: "wd",
		Logo:       "google-cn.ico",
		Enabled:    false,
	}); err != nil {
		t.Fatalf("update search engine: %v", err)
	}

	if err := UpdateSearchEngineSort([]types.UpdateSearchEngineSortItem{
		{Id: 1, Sort: 5},
		{Id: int(newID), Sort: 3},
	}); err != nil {
		t.Fatalf("update search engine sort: %v", err)
	}

	var updated types.SearchEngine
	if err := db.QueryRow(`
		SELECT id, name, baseUrl, queryParam, logo, sort, enabled
		FROM nav_search_engine
		WHERE id = ?
	`, newID).Scan(&updated.Id, &updated.Name, &updated.BaseUrl, &updated.QueryParam, &updated.Logo, &updated.Sort, &updated.Enabled); err != nil {
		t.Fatalf("load updated search engine: %v", err)
	}
	if updated.Name != "Google CN" || updated.BaseUrl != "https://google.cn" || updated.Sort != 3 || updated.Enabled {
		t.Fatalf("unexpected updated search engine: %+v", updated)
	}

	if err := DeleteSearchEngine(2); err != nil {
		t.Fatalf("delete search engine: %v", err)
	}

	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM nav_search_engine WHERE id = 2`).Scan(&count); err != nil {
		t.Fatalf("count deleted search engine: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected search engine deleted, got count=%d", count)
	}
}
