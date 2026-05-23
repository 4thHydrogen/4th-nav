package service

import (
	"fmt"
	"strconv"
	"strings"
	"sync"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/4thHydrogen/4th-nav/utils"
)

func normalizeViewMode(v string) string {
	if v == "card" {
		return "card"
	}
	return "icon"
}

func normalizeFolderViewMode(v string) string {
	if v == "list" {
		return "list"
	}
	return "grid"
}

func normalizeFolderItemSize(v int) int {
	if v < 20 {
		return 20
	}
	if v > 48 {
		return 48
	}
	return v
}

func normalizeToolType(v string) string {
	if v == "folder" {
		return "folder"
	}
	return "icon"
}

func normalizeToolSize(v string) string {
	parts := strings.Split(v, "x")
	if len(parts) != 2 {
		return "1x1"
	}
	w, err1 := strconv.Atoi(parts[0])
	h, err2 := strconv.Atoi(parts[1])
	if err1 != nil || err2 != nil || w < 1 || h < 1 || w > 6 || h > 6 {
		return "1x1"
	}
	return fmt.Sprintf("%dx%d", w, h)
}

// normalizeGrid 把不合法的 gridX/gridY 值（如 Go 零值 0 但未明确指定）规范化为 -1（auto layout）。
// 用户拖拽产生的位置 (>= 0) 保留；前端 AddTool 未指定位置时一律视为 -1，
// 防止"新建工具被钉在 (0,0)"的 bug 污染整体布局。
func normalizeGrid(v int) int {
	if v < 0 {
		return -1
	}
	return v
}

func ImportTools(data []types.Tool) {
	var catelogs []string
	for _, v := range data {
		if v.Catelog != "" && strings.TrimSpace(v.Catelog) != "" && !utils.In(v.Catelog, catelogs) {
			catelogs = append(catelogs, v.Catelog)
		}
		viewMode := normalizeViewMode(v.ViewMode)
		toolType := normalizeToolType(v.Type)
		size := normalizeToolSize(v.Size)
		sql_add_tool := `
			INSERT INTO nav_table (id, name, catelog, url, logo, ` + "`desc`" + `, sort, hide, view_mode, type, parent_id, size, bg_color, grid_x, grid_y, folder_view_mode, folder_item_size)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
			`
		stmt, err := database.DB.Prepare(sql_add_tool)
		utils.CheckErr(err)
		res, err := stmt.Exec(v.Id, v.Name, v.Catelog, v.Url, v.Logo, v.Desc, v.Sort, v.Hide, viewMode, toolType, v.ParentId, size, v.BgColor, v.GridX, v.GridY, normalizeFolderViewMode(v.FolderViewMode), normalizeFolderItemSize(v.FolderItemSize))
		utils.CheckErr(err)
		_, err = res.LastInsertId()
		utils.CheckErr(err)
	}
	for _, catelog := range catelogs {
		var addCatelogDto types.AddCategoryDto
		addCatelogDto.Name = catelog
		AddCategory(addCatelogDto)
	}
	go func(data []types.Tool) {
		sem := make(chan struct{}, 4)
		var wg sync.WaitGroup
		for _, v := range data {
			wg.Add(1)
			sem <- struct{}{}
			go func(tool types.Tool) {
				defer wg.Done()
				defer func() { <-sem }()
				UpdateImg(tool.Logo)
			}(v)
		}
		wg.Wait()
	}(data)
}

func UpdateTool(data types.UpdateToolDto) {
	// 保留现有网格位置：auto-layout 条目的 gridX/gridY 为 -1 且未持久化到 DB，
	// 前端 handleSetSize 用 {...tool, size} 会把 -1 写回，导致 buildLayout 把它当新项排到第一行。
	if data.GridX < 0 || data.GridY < 0 {
		var cx, cy int
		database.DB.QueryRow(`SELECT grid_x, grid_y FROM nav_table WHERE id = ?`, data.Id).Scan(&cx, &cy)
		if data.GridX < 0 {
			data.GridX = cx
		}
		if data.GridY < 0 {
			data.GridY = cy
		}
	}
	sql_update_tool := `
		UPDATE nav_table
		SET name = ?, url = ?, logo = ?, catelog = ?, ` + "`desc`" + ` = ?, sort = ?, hide = ?, view_mode = ?, type = ?, parent_id = ?, size = ?, bg_color = ?, grid_x = ?, grid_y = ?, folder_view_mode = ?, folder_item_size = ?
		WHERE id = ?;
		`
	stmt, err := database.DB.Prepare(sql_update_tool)
	utils.CheckErr(err)
	res, err := stmt.Exec(data.Name, data.Url, data.Logo, data.Catelog, data.Desc, data.Sort, data.Hide, normalizeViewMode(data.ViewMode), normalizeToolType(data.Type), data.ParentId, normalizeToolSize(data.Size), data.BgColor, data.GridX, data.GridY, normalizeFolderViewMode(data.FolderViewMode), normalizeFolderItemSize(data.FolderItemSize), data.Id)
	utils.CheckErr(err)
	_, err = res.RowsAffected()
	utils.CheckErr(err)
	UpdateImg(data.Logo)
}

func AddTool(data types.AddToolDto) (int64, error) {
	var mu sync.Mutex
	mu.Lock()
	defer mu.Unlock()

	tx, err := database.DB.Begin()
	if err != nil {
		return 0, err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	sql_add_tool := `
		INSERT INTO nav_table (name, url, logo, catelog, ` + "`desc`" + `, sort, hide, view_mode, type, parent_id, size, bg_color, grid_x, grid_y, folder_view_mode, folder_item_size)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
		`
	stmt, err := tx.Prepare(sql_add_tool)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	res, err := stmt.Exec(data.Name, data.Url, data.Logo, data.Catelog, data.Desc, data.Sort, data.Hide, normalizeViewMode(data.ViewMode), normalizeToolType(data.Type), data.ParentId, normalizeToolSize(data.Size), data.BgColor, normalizeGrid(data.GridX), normalizeGrid(data.GridY), normalizeFolderViewMode(data.FolderViewMode), normalizeFolderItemSize(data.FolderItemSize))
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	err = tx.Commit()
	if err != nil {
		return 0, err
	}
	logger.LogInfo("新增工具: %s", data.Name)

	if data.Logo != "" {
		UpdateImg(data.Logo)
	}

	return id, nil
}

func GetAllTool() []types.Tool {
	sql_get_all := `
		SELECT id,name,url,logo,catelog,` + "`desc`" + `,sort,hide,view_mode,type,parent_id,size,bg_color,grid_x,grid_y,folder_view_mode,folder_item_size FROM nav_table order by sort;
		`
	results := make([]types.Tool, 0)
	rows, err := database.DB.Query(sql_get_all)
	utils.CheckErr(err)
	for rows.Next() {
		var tool types.Tool
		var hide interface{}
		var sort interface{}
		var viewMode interface{}
		var toolType interface{}
		var parentId interface{}
		var size interface{}
		var bgColor interface{}
		var gridX interface{}
		var gridY interface{}
		var folderViewMode interface{}
		var folderItemSize interface{}
		err = rows.Scan(&tool.Id, &tool.Name, &tool.Url, &tool.Logo, &tool.Catelog, &tool.Desc, &sort, &hide, &viewMode, &toolType, &parentId, &size, &bgColor, &gridX, &gridY, &folderViewMode, &folderItemSize)
		if hide == nil {
			tool.Hide = false
		} else {
			if hide.(int64) == 0 {
				tool.Hide = false
			} else {
				tool.Hide = true
			}
		}
		if sort == nil {
			tool.Sort = 0
		} else {
			i64 := sort.(int64)
			tool.Sort = int(i64)
		}
		if viewMode == nil || viewMode.(string) == "" {
			tool.ViewMode = "icon"
		} else {
			tool.ViewMode = normalizeViewMode(viewMode.(string))
		}
		if toolType == nil || toolType.(string) == "" {
			tool.Type = "icon"
		} else {
			tool.Type = normalizeToolType(toolType.(string))
		}
		if parentId == nil {
			tool.ParentId = nil
		} else {
			pid := int(parentId.(int64))
			tool.ParentId = &pid
		}
		if size == nil || size.(string) == "" {
			tool.Size = "1x1"
		} else {
			tool.Size = normalizeToolSize(size.(string))
		}
		if bgColor == nil {
			tool.BgColor = ""
		} else {
			tool.BgColor = bgColor.(string)
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
			tool.FolderViewMode = normalizeFolderViewMode(folderViewMode.(string))
		}
		if folderItemSize == nil {
			tool.FolderItemSize = 28
		} else {
			tool.FolderItemSize = normalizeFolderItemSize(int(folderItemSize.(int64)))
		}
		utils.CheckErr(err)
		results = append(results, tool)
	}
	defer rows.Close()
	return results
}

func GetToolLogoUrlById(id int) string {
	sql_get_tool := `
		SELECT logo FROM nav_table WHERE id=?;
		`
	rows, err := database.DB.Query(sql_get_tool, id)
	utils.CheckErr(err)
	var tool types.Tool
	for rows.Next() {
		err = rows.Scan(&tool.Logo)
		utils.CheckErr(err)
	}
	defer rows.Close()
	return tool.Logo
}

func UpdateToolIcon(id int64, logo string) {
	sql_update_tool := `
		UPDATE nav_table SET logo=? WHERE id=?;
		`
	_, err := database.DB.Exec(sql_update_tool, logo, id)
	utils.CheckErr(err)
	UpdateImg(logo)
}

func UpdateToolsSort(updates []types.UpdateToolsSortDto) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}

	sql := `UPDATE nav_table SET sort = ? WHERE id = ?`
	stmt, err := tx.Prepare(sql)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for _, update := range updates {
		_, err = stmt.Exec(update.Sort, update.Id)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}

func UpdateToolViewMode(id int, viewMode string) error {
	viewMode = normalizeViewMode(viewMode)
	_, err := database.DB.Exec(
		`UPDATE nav_table SET view_mode = ? WHERE id = ?;`,
		viewMode, id,
	)
	return err
}

func UpdateFolderSettings(id int, folderViewMode string, folderItemSize int) error {
	_, err := database.DB.Exec(
		`UPDATE nav_table SET folder_view_mode = ?, folder_item_size = ? WHERE id = ?;`,
		normalizeFolderViewMode(folderViewMode), normalizeFolderItemSize(folderItemSize), id,
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
	// 空 payload 不应静默 commit — 早返回保证前端能感知到异常
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
