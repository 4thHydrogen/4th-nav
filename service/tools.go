package service

import (
	"fmt"
	"strconv"
	"strings"
	"sync"

	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/repository"
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
		err := repository.ImportTool(v)
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
	if data.GridX < 0 || data.GridY < 0 {
		tool, err := repository.GetToolByID(int64(data.Id))
		utils.CheckErr(err)
		if data.GridX < 0 {
			data.GridX = tool.GridX
		}
		if data.GridY < 0 {
			data.GridY = tool.GridY
		}
	}
	err := repository.UpdateTool(data)
	utils.CheckErr(err)
	UpdateImg(data.Logo)
}

func AddTool(data types.AddToolDto) (int64, error) {
	id, err := repository.CreateTool(data)
	if err != nil {
		return 0, err
	}
	logger.LogInfo("鏂板宸ュ叿: %s", data.Name)

	if data.Logo != "" {
		UpdateImg(data.Logo)
	}

	return id, nil
}

func GetAllTool() []types.Tool {
	results, err := repository.GetAllTools()
	utils.CheckErr(err)
	return results
}

func GetToolLogoUrlById(id int) string {
	logo, err := repository.GetToolLogoURLByID(id)
	utils.CheckErr(err)
	return logo
}

func UpdateToolIcon(id int64, logo string) {
	err := repository.UpdateToolLogoByID(id, logo)
	utils.CheckErr(err)
	UpdateImg(logo)
}

func DeleteTool(id int) error {
	return repository.DeleteTool(id)
}

func UpdateToolsSort(updates []types.UpdateToolsSortDto) error {
	return repository.UpdateToolsSort(updates)
}

func UpdateToolViewMode(id int, viewMode string) error {
	viewMode = normalizeViewMode(viewMode)
	return repository.UpdateToolViewMode(id, viewMode)
}

func UpdateFolderSettings(id int, folderViewMode string, folderItemSize int) error {
	return repository.UpdateFolderSettings(id, normalizeFolderViewMode(folderViewMode), normalizeFolderItemSize(folderItemSize))
}

func MoveToolToFolder(toolId int, parentId *int) error {
	toolType, err := repository.GetToolTypeByID(toolId)
	if err != nil {
		return err
	}
	if toolType == "folder" && parentId != nil {
		return fmt.Errorf("folders cannot be moved into another folder")
	}

	oldParentID, err := repository.GetToolParentID(toolId)
	if err != nil {
		return err
	}

	if err := repository.MoveToolToFolder(toolId, parentId); err != nil {
		return err
	}

	if oldParentID != nil && (parentId == nil || *parentId != *oldParentID) {
		childCount, err := repository.CountChildren(*oldParentID)
		if err != nil {
			return err
		}
		if childCount == 0 {
			if err := repository.DeleteFolder(*oldParentID, "move-children-to-root"); err != nil {
				return err
			}
			logger.LogInfo("empty folder removed after move: folderId=%d", *oldParentID)
		}
	}

	return nil
}

func DeleteFolder(folderId int, mode string) error {
	return repository.DeleteFolder(folderId, mode)
}

func UpdateLayout(data types.UpdateLayoutDto) error {
	return repository.UpdateLayout(data)
}
