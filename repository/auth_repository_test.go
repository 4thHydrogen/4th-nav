package repository

import (
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
	_ "modernc.org/sqlite"
)

func setupAuthRepositoryTestDB(t *testing.T) *sql.DB {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "auth-repo-test.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	stmts := []string{
		`CREATE TABLE nav_api_token (
			id INTEGER PRIMARY KEY,
			name TEXT,
			value TEXT,
			disabled INTEGER
		);`,
		`CREATE TABLE nav_user (
			id INTEGER PRIMARY KEY,
			name TEXT,
			password TEXT
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

func TestGetActiveAPITokens(t *testing.T) {
	db := setupAuthRepositoryTestDB(t)
	if _, err := db.Exec(`
		INSERT INTO nav_api_token (id, name, value, disabled) VALUES
			(1, 'active', 'a', 0),
			(2, 'disabled', 'b', 1);
	`); err != nil {
		t.Fatalf("seed tokens: %v", err)
	}

	tokens, err := GetActiveAPITokens()
	if err != nil {
		t.Fatalf("get active tokens: %v", err)
	}
	if len(tokens) != 1 || tokens[0].Name != "active" {
		t.Fatalf("unexpected tokens: %+v", tokens)
	}

	exists, err := ExistsActiveAPIToken("a")
	if err != nil {
		t.Fatalf("exists active token: %v", err)
	}
	if !exists {
		t.Fatalf("expected active token to exist")
	}

	missing, err := ExistsActiveAPIToken("missing")
	if err != nil {
		t.Fatalf("missing active token: %v", err)
	}
	if missing {
		t.Fatalf("expected missing token to be false")
	}
}

func TestGetUserByName(t *testing.T) {
	db := setupAuthRepositoryTestDB(t)
	if _, err := db.Exec(`INSERT INTO nav_user (id, name, password) VALUES (1, 'admin', 'hashed')`); err != nil {
		t.Fatalf("seed user: %v", err)
	}

	user, err := GetUserByName("admin")
	if err != nil {
		t.Fatalf("get user: %v", err)
	}
	if user.Name != "admin" || user.Password != "hashed" {
		t.Fatalf("unexpected user: %+v", user)
	}
}

func TestInsertDisableAndUpdateAuthRecords(t *testing.T) {
	db := setupAuthRepositoryTestDB(t)
	if _, err := db.Exec(`INSERT INTO nav_user (id, name, password) VALUES (7, 'old', 'pw')`); err != nil {
		t.Fatalf("seed user: %v", err)
	}

	if err := InsertAPIToken(types.Token{Id: 5, Name: "api", Value: "jwt", Disabled: 0}); err != nil {
		t.Fatalf("insert token: %v", err)
	}
	if err := DisableAPIToken(5); err != nil {
		t.Fatalf("disable token: %v", err)
	}
	if err := UpdateUser(types.UpdateUserDto{Id: 7, Name: "new", Password: "hashed"}); err != nil {
		t.Fatalf("update user: %v", err)
	}

	var disabled int
	if err := db.QueryRow(`SELECT disabled FROM nav_api_token WHERE id = 5`).Scan(&disabled); err != nil {
		t.Fatalf("load token: %v", err)
	}
	if disabled != 1 {
		t.Fatalf("expected token disabled, got %d", disabled)
	}

	var name, password string
	if err := db.QueryRow(`SELECT name, password FROM nav_user WHERE id = 7`).Scan(&name, &password); err != nil {
		t.Fatalf("load user: %v", err)
	}
	if name != "new" || password != "hashed" {
		t.Fatalf("unexpected user fields: %s %s", name, password)
	}
}
