package repository

import (
	"database/sql"
	"fmt"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
)

func GetDockItems() ([]types.DockItem, error) {
	rows, err := database.DB.Query(`
		SELECT di.id, di.sort, t.id, t.name, t.url, t.logo, t.catelog, t.desc
		FROM dock_items di
		JOIN nav_table t ON di.tool_id = t.id
		ORDER BY di.sort ASC;
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]types.DockItem, 0)
	for rows.Next() {
		var item types.DockItem
		if err := rows.Scan(&item.ID, &item.Sort, &item.ToolID, &item.Name, &item.Url, &item.Logo, &item.Catelog, &item.Desc); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func AddDockItem(toolID int) error {
	var exists int
	err := database.DB.QueryRow(`SELECT 1 FROM nav_table WHERE id = ?`, toolID).Scan(&exists)
	if err == sql.ErrNoRows {
		return fmt.Errorf("tool not found: %d", toolID)
	}
	if err != nil {
		return err
	}

	var count int
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM dock_items WHERE tool_id = ?`, toolID).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("tool already exists in dock: %d", toolID)
	}

	var maxSort sql.NullInt64
	if err := database.DB.QueryRow(`SELECT MAX(sort) FROM dock_items`).Scan(&maxSort); err != nil {
		return err
	}
	nextSort := 0
	if maxSort.Valid {
		nextSort = int(maxSort.Int64) + 1
	}

	_, err = database.DB.Exec(`INSERT INTO dock_items (tool_id, sort) VALUES (?, ?)`, toolID, nextSort)
	return err
}

func RemoveDockItem(id int) error {
	_, err := database.DB.Exec(`DELETE FROM dock_items WHERE id = ?`, id)
	return err
}

func UpdateDockSort(updates []types.UpdateDockSortDto) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare(`UPDATE dock_items SET sort = ? WHERE id = ?`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for _, update := range updates {
		if _, err := stmt.Exec(update.Sort, update.ID); err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}
