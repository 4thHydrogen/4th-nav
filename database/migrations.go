package database

import "github.com/4thHydrogen/4th-nav/logger"

type migration struct {
	id   string
	name string
	run  func() error
}

var migrations = []migration{
	{
		id:   "2024_12_13_nav_catelog_rebuild",
		name: "rebuild nav_catelog with non-null sort and hide columns",
		run:  migration_2024_12_13,
	},
	{
		id:   "2026_05_24_canonical_schema",
		name: "rename legacy category, tool, and surface columns to canonical names",
		run:  migration_2026_05_24,
	},
}

func ensureSchemaMigrationsTable() error {
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
		);
	`)
	return err
}

func hasMigration(id string) (bool, error) {
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM schema_migrations WHERE id = ?`, id).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func markMigrationApplied(m migration) error {
	_, err := DB.Exec(`INSERT INTO schema_migrations (id, name) VALUES (?, ?)`, m.id, m.name)
	return err
}

func runMigrations() error {
	if err := ensureSchemaMigrationsTable(); err != nil {
		return err
	}

	for _, m := range migrations {
		applied, err := hasMigration(m.id)
		if err != nil {
			return err
		}
		if applied {
			continue
		}

		logger.LogInfo("Applying migration %s (%s)", m.id, m.name)
		if err := m.run(); err != nil {
			return err
		}
		if err := markMigrationApplied(m); err != nil {
			return err
		}
	}

	return nil
}
