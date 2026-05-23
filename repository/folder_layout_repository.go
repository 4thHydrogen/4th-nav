package repository

import (
	"fmt"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
)

func UpdateFolderSettings(id int, folderViewMode string, folderItemSize int) error {
	_, err := database.DB.Exec(
		`UPDATE nav_table SET folder_view_mode = ?, folder_item_size = ? WHERE id = ?;`,
		folderViewMode, folderItemSize, id,
	)
	return err
}

func MoveToolToFolder(toolId int, parentId *int) error {
	_, err := database.DB.Exec(
		`UPDATE nav_table SET parent_id = ? WHERE id = ?;`,
		parentId, toolId,
	)
	return err
}

func DeleteFolder(folderId int, mode string) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	if mode == "delete-with-children" {
		_, err = tx.Exec(`DELETE FROM nav_table WHERE parent_id = ?;`, folderId)
		if err != nil {
			return err
		}
		_, err = tx.Exec(`DELETE FROM dock_items WHERE tool_id IN (SELECT id FROM nav_table WHERE parent_id = ?);`, folderId)
		if err != nil {
			return err
		}
	} else {
		_, err = tx.Exec(`UPDATE nav_table SET parent_id = NULL WHERE parent_id = ?;`, folderId)
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec(`DELETE FROM dock_items WHERE tool_id = ?;`, folderId)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`DELETE FROM nav_table WHERE id = ?;`, folderId)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func UpdateLayout(data types.UpdateLayoutDto) error {
	if len(data.Items) == 0 {
		return fmt.Errorf("UpdateLayout: empty items payload")
	}

	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	stmt, err := tx.Prepare("UPDATE nav_table SET grid_x = ?, grid_y = ? WHERE id = ?")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, item := range data.Items {
		_, err = stmt.Exec(item.GridX, item.GridY, item.Id)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
