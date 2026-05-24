package database

func tableExists(tableName string) bool {
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?`, tableName).Scan(&count)
	if err != nil {
		return false
	}
	return count > 0
}

func migration_2026_05_24() error {
	if tableExists("nav_catelog") && !tableExists("nav_category") {
		if _, err := DB.Exec(`ALTER TABLE nav_catelog RENAME TO nav_category;`); err != nil {
			return err
		}
	}

	if columnExists("nav_table", "catelog") && !columnExists("nav_table", "category") {
		if _, err := DB.Exec(`ALTER TABLE nav_table RENAME COLUMN catelog TO category;`); err != nil {
			return err
		}
	}

	if columnExists("nav_table", "desc") && !columnExists("nav_table", "description") {
		if _, err := DB.Exec(`ALTER TABLE nav_table RENAME COLUMN "desc" TO description;`); err != nil {
			return err
		}
	}

	if columnExists("nav_table", "bg_color") && !columnExists("nav_table", "folder_tint") {
		if _, err := DB.Exec(`ALTER TABLE nav_table RENAME COLUMN bg_color TO folder_tint;`); err != nil {
			return err
		}
	}

	if columnExists("nav_setting", "enableGlassmorphism") && !columnExists("nav_setting", "enableSurfaceEffects") {
		if _, err := DB.Exec(`ALTER TABLE nav_setting RENAME COLUMN enableGlassmorphism TO enableSurfaceEffects;`); err != nil {
			return err
		}
	}

	return nil
}
