package service

import (
	"strings"

	"github.com/4thHydrogen/4th-nav/repository"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/4thHydrogen/4th-nav/utils"
)

func UpdateCategory(data types.UpdateCategoryDto) error {
	return repository.UpdateCategory(data)
}

func AddCategory(data types.AddCategoryDto) error {
	if data.Name == "" || strings.TrimSpace(data.Name) == "" {
		return nil
	}

	existingCategories, err := GetAllCategories()
	if err != nil {
		return err
	}
	names := make([]string, 0, len(existingCategories))
	for _, category := range existingCategories {
		names = append(names, category.Name)
	}
	if utils.In(data.Name, names) {
		return nil
	}

	return repository.CreateCategory(data)
}

func DeleteCategory(id int) error {
	return repository.DeleteCategory(id)
}

func GetAllCategories() ([]types.Category, error) {
	return repository.GetAllCategories()
}
