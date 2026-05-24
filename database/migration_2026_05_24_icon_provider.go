package database

func migration_2026_05_24_icon_provider() error {
	if !columnExists("nav_table", "icon_source") {
		if _, err := DB.Exec(`ALTER TABLE nav_table ADD COLUMN icon_source TEXT NOT NULL DEFAULT '';`); err != nil {
			return err
		}
	}

	if !columnExists("nav_setting", "icon_provider_mode") {
		if _, err := DB.Exec(`ALTER TABLE nav_setting ADD COLUMN icon_provider_mode TEXT NOT NULL DEFAULT 'local-only';`); err != nil {
			return err
		}
	}

	if !columnExists("nav_setting", "brandfetch_client_id") {
		if _, err := DB.Exec(`ALTER TABLE nav_setting ADD COLUMN brandfetch_client_id TEXT NOT NULL DEFAULT '';`); err != nil {
			return err
		}
	}

	if !columnExists("nav_setting", "enable_brandfetch") {
		if _, err := DB.Exec(`ALTER TABLE nav_setting ADD COLUMN enable_brandfetch BOOLEAN NOT NULL DEFAULT 0;`); err != nil {
			return err
		}
	}

	if !columnExists("nav_setting", "enable_icon_horse") {
		if _, err := DB.Exec(`ALTER TABLE nav_setting ADD COLUMN enable_icon_horse BOOLEAN NOT NULL DEFAULT 0;`); err != nil {
			return err
		}
	}

	return nil
}
