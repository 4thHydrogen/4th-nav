package repository

import (
	"database/sql"
	"fmt"
	"net/url"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
)

func scanToolRow(scanner interface {
	Scan(dest ...any) error
}) (types.Tool, error) {
	var tool types.Tool
	var hide interface{}
	var sort interface{}
	var viewMode interface{}
	var toolType interface{}
	var parentID interface{}
	var size interface{}
	var folderTint interface{}
	var gridX interface{}
	var gridY interface{}
	var folderViewMode interface{}
	var folderItemSize interface{}

	err := scanner.Scan(&tool.Id, &tool.Name, &tool.Url, &tool.Logo, &tool.Category, &tool.Description, &sort, &hide, &viewMode, &toolType, &parentID, &size, &folderTint, &gridX, &gridY, &folderViewMode, &folderItemSize)
	if err != nil {
		return types.Tool{}, err
	}

	if hide != nil && hide.(int64) != 0 {
		tool.Hide = true
	}
	if sort != nil {
		tool.Sort = int(sort.(int64))
	}
	if viewMode == nil || viewMode.(string) == "" {
		tool.ViewMode = "icon"
	} else {
		tool.ViewMode = types.NormalizeViewMode(viewMode.(string))
	}
	if toolType == nil || toolType.(string) == "" {
		tool.Type = "icon"
	} else {
		tool.Type = types.NormalizeToolType(toolType.(string))
	}
	if parentID != nil {
		pid := int(parentID.(int64))
		tool.ParentId = &pid
	}
	if size == nil || size.(string) == "" {
		tool.Size = "1x1"
	} else {
		tool.Size = types.NormalizeToolSize(size.(string))
	}
	if folderTint != nil {
		tool.FolderTint = folderTint.(string)
	}
	if gridX == nil {
		tool.GridX = -1
	} else {
		tool.GridX = int(gridX.(int64))
	}
	if gridY == nil {
		tool.GridY = -1
	} else {
		tool.GridY = int(gridY.(int64))
	}
	if folderViewMode == nil || folderViewMode.(string) == "" {
		tool.FolderViewMode = "grid"
	} else {
		tool.FolderViewMode = types.NormalizeFolderViewMode(folderViewMode.(string))
	}
	if folderItemSize == nil {
		tool.FolderItemSize = 28
	} else {
		tool.FolderItemSize = types.NormalizeFolderItemSize(int(folderItemSize.(int64)))
	}

	return tool, nil
}

func GetAllTools() ([]types.Tool, error) {
	rows, err := database.DB.Query(`
		SELECT id,name,url,logo,category,description,sort,hide,view_mode,type,parent_id,size,folder_tint,grid_x,grid_y,folder_view_mode,folder_item_size
		FROM nav_table
		ORDER BY sort;
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]types.Tool, 0)
	for rows.Next() {
		tool, err := scanToolRow(rows)
		if err != nil {
			return nil, err
		}

		results = append(results, tool)
	}

	return results, nil
}

func GetToolByID(id int64) (types.Tool, error) {
	row := database.DB.QueryRow(`
		SELECT id,name,url,logo,category,description,sort,hide,view_mode,type,parent_id,size,folder_tint,grid_x,grid_y,folder_view_mode,folder_item_size
		FROM nav_table
		WHERE id = ?;
	`, id)

	tool, err := scanToolRow(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return types.Tool{}, fmt.Errorf("tool %d not found", id)
		}
		return types.Tool{}, err
	}

	return tool, nil
}

func GetToolLogoURLByID(id int) (string, error) {
	var logo string
	err := database.DB.QueryRow(`SELECT logo FROM nav_table WHERE id = ?;`, id).Scan(&logo)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return logo, nil
}

func GetToolParentID(id int) (*int, error) {
	var parentID sql.NullInt64
	err := database.DB.QueryRow(`SELECT parent_id FROM nav_table WHERE id = ?;`, id).Scan(&parentID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("tool %d not found", id)
		}
		return nil, err
	}
	if !parentID.Valid {
		return nil, nil
	}
	pid := int(parentID.Int64)
	return &pid, nil
}

func GetToolTypeByID(id int) (string, error) {
	var toolType string
	err := database.DB.QueryRow(`SELECT type FROM nav_table WHERE id = ?;`, id).Scan(&toolType)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("tool %d not found", id)
		}
		return "", err
	}
	return toolType, nil
}

func UpdateToolLogoByID(id int64, logo string) error {
	_, err := database.DB.Exec(`UPDATE nav_table SET logo = ? WHERE id = ?;`, logo, id)
	return err
}

func DeleteTool(id int) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	var parentID sql.NullInt64
	var logo string
	err = tx.QueryRow(`SELECT parent_id, logo FROM nav_table WHERE id = ?;`, id).Scan(&parentID, &logo)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("tool %d not found", id)
		}
		return err
	}

	if _, err = tx.Exec(`DELETE FROM nav_table WHERE id = ?;`, id); err != nil {
		return err
	}
	if _, err = tx.Exec(`DELETE FROM dock_items WHERE tool_id = ?;`, id); err != nil {
		return err
	}
	if logo != "" {
		encodedURL := url.QueryEscape(logo)
		if _, err = tx.Exec(`DELETE FROM nav_img WHERE url = ?;`, encodedURL); err != nil {
			return err
		}
	}

	if parentID.Valid {
		var childCount int
		if err = tx.QueryRow(`SELECT COUNT(*) FROM nav_table WHERE parent_id = ?;`, parentID.Int64).Scan(&childCount); err != nil {
			return err
		}
		if childCount == 0 {
			if _, err = tx.Exec(`DELETE FROM dock_items WHERE tool_id = ?;`, parentID.Int64); err != nil {
				return err
			}
			if _, err = tx.Exec(`DELETE FROM nav_table WHERE id = ? AND type = 'folder';`, parentID.Int64); err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}

func CreateTool(data types.AddToolDto) (int64, error) {
	tx, err := database.DB.Begin()
	if err != nil {
		return 0, err
	}

	stmt, err := tx.Prepare(`
		INSERT INTO nav_table (name, url, logo, category, description, sort, hide, view_mode, type, parent_id, size, folder_tint, grid_x, grid_y, folder_view_mode, folder_item_size)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
	`)
	if err != nil {
		tx.Rollback()
		return 0, err
	}
	defer stmt.Close()

	res, err := stmt.Exec(
		data.Name,
		data.Url,
		data.Logo,
		data.Category,
		data.Description,
		data.Sort,
		data.Hide,
		types.NormalizeViewMode(data.ViewMode),
		types.NormalizeToolType(data.Type),
		data.ParentId,
		types.NormalizeToolSize(data.Size),
		data.FolderTint,
		types.NormalizeGrid(data.GridX),
		types.NormalizeGrid(data.GridY),
		types.NormalizeFolderViewMode(data.FolderViewMode),
		types.NormalizeFolderItemSize(data.FolderItemSize),
	)
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return id, nil
}

func ImportTool(data types.Tool) error {
	_, err := database.DB.Exec(`
		INSERT INTO nav_table (id, name, category, url, logo, description, sort, hide, view_mode, type, parent_id, size, folder_tint, grid_x, grid_y, folder_view_mode, folder_item_size)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
	`,
		data.Id,
		data.Name,
		data.Category,
		data.Url,
		data.Logo,
		data.Description,
		data.Sort,
		data.Hide,
		types.NormalizeViewMode(data.ViewMode),
		types.NormalizeToolType(data.Type),
		data.ParentId,
		types.NormalizeToolSize(data.Size),
		data.FolderTint,
		types.NormalizeGrid(data.GridX),
		types.NormalizeGrid(data.GridY),
		types.NormalizeFolderViewMode(data.FolderViewMode),
		types.NormalizeFolderItemSize(data.FolderItemSize),
	)
	return err
}

func UpdateTool(data types.UpdateToolDto) error {
	_, err := database.DB.Exec(`
		UPDATE nav_table
		SET name = ?, url = ?, logo = ?, category = ?, description = ?, sort = ?, hide = ?, view_mode = ?, type = ?, parent_id = ?, size = ?, folder_tint = ?, grid_x = ?, grid_y = ?, folder_view_mode = ?, folder_item_size = ?
		WHERE id = ?;
	`,
		data.Name,
		data.Url,
		data.Logo,
		data.Category,
		data.Description,
		data.Sort,
		data.Hide,
		types.NormalizeViewMode(data.ViewMode),
		types.NormalizeToolType(data.Type),
		data.ParentId,
		types.NormalizeToolSize(data.Size),
		data.FolderTint,
		types.NormalizeGrid(data.GridX),
		types.NormalizeGrid(data.GridY),
		types.NormalizeFolderViewMode(data.FolderViewMode),
		types.NormalizeFolderItemSize(data.FolderItemSize),
		data.Id,
	)
	return err
}

func UpdateToolsSort(updates []types.UpdateToolsSortDto) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare(`UPDATE nav_table SET sort = ? WHERE id = ?`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for _, update := range updates {
		if _, err = stmt.Exec(update.Sort, update.Id); err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}

func UpdateToolViewMode(id int, viewMode string) error {
	_, err := database.DB.Exec(
		`UPDATE nav_table SET view_mode = ? WHERE id = ?;`,
		viewMode, id,
	)
	return err
}
