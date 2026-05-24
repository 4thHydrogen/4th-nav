package service

import (
	"fmt"
	"strings"
	"sync"

	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/repository"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/4thHydrogen/4th-nav/utils"
)

func ImportTools(data []types.Tool) error {
	var categories []string
	for _, v := range data {
		if v.Category != "" && strings.TrimSpace(v.Category) != "" && !utils.In(v.Category, categories) {
			categories = append(categories, v.Category)
		}
	}

	if err := repository.ImportToolsTx(data); err != nil {
		return fmt.Errorf("import tools transaction: %w", err)
	}

	for _, category := range categories {
		dto := types.AddCategoryDto{Name: category}
		if err := AddCategory(dto); err != nil {
			logger.LogError("failed to add category during import: %v", err)
		}
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
	return nil
}

func UpdateTool(data types.UpdateToolDto) error {
	if data.GridX < 0 || data.GridY < 0 {
		tool, err := repository.GetToolByID(int64(data.Id))
		if err != nil {
			return err
		}
		if data.GridX < 0 {
			data.GridX = tool.GridX
		}
		if data.GridY < 0 {
			data.GridY = tool.GridY
		}
	}
	if err := repository.UpdateTool(data); err != nil {
		return err
	}
	UpdateImg(data.Logo)
	return nil
}

func AddTool(data types.AddToolDto) (int64, error) {
	id, err := repository.CreateTool(data)
	if err != nil {
		return 0, err
	}
	logger.LogInfo("新增工具: %s", data.Name)

	if data.Logo != "" {
		UpdateImg(data.Logo)
	}

	return id, nil
}

func GetAllTool() ([]types.Tool, error) {
	return repository.GetAllTools()
}

func GetToolLogoUrlById(id int) (string, error) {
	return repository.GetToolLogoURLByID(id)
}

func UpdateToolIcon(id int64, logo string) error {
	if err := repository.UpdateToolLogoByID(id, logo); err != nil {
		return err
	}
	UpdateImg(logo)
	return nil
}

func DeleteTool(id int) error {
	return repository.DeleteTool(id)
}

func UpdateToolsSort(updates []types.UpdateToolsSortDto) error {
	return repository.UpdateToolsSort(updates)
}

func UpdateToolViewMode(id int, viewMode string) error {
	viewMode = types.NormalizeViewMode(viewMode)
	return repository.UpdateToolViewMode(id, viewMode)
}

func UpdateFolderSettings(id int, folderViewMode string, folderItemSize int) error {
	return repository.UpdateFolderSettings(id, types.NormalizeFolderViewMode(folderViewMode), types.NormalizeFolderItemSize(folderItemSize))
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
