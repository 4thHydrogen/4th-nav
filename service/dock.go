package service

import (
	"github.com/4thHydrogen/4th-nav/repository"
	"github.com/4thHydrogen/4th-nav/types"
)

func GetDockItems() ([]types.DockItem, error) {
	return repository.GetDockItems()
}

func AddDockItem(toolID int) error {
	return repository.AddDockItem(toolID)
}

func RemoveDockItem(id int) error {
	return repository.RemoveDockItem(id)
}

func UpdateDockSort(updates []types.UpdateDockSortDto) error {
	return repository.UpdateDockSort(updates)
}
