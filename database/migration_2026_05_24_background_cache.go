package database

func migration_2026_05_24_background_cache() error {
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS background_cache (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			source TEXT NOT NULL,
			theme TEXT NOT NULL DEFAULT '',
			filename TEXT NOT NULL UNIQUE,
			original_url TEXT NOT NULL DEFAULT '',
			photographer TEXT NOT NULL DEFAULT '',
			photographer_url TEXT NOT NULL DEFAULT '',
			photo_page_url TEXT NOT NULL DEFAULT '',
			avg_color TEXT NOT NULL DEFAULT '',
			content_type TEXT NOT NULL DEFAULT '',
			file_size INTEGER NOT NULL DEFAULT 0,
			expires_at INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
		);
		CREATE INDEX IF NOT EXISTS idx_background_cache_source_theme
			ON background_cache(source, theme, created_at);
	`)
	return err
}
