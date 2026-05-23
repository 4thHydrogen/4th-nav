package service

import (
	"strings"

	"github.com/4thHydrogen/4th-nav/repository"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/4thHydrogen/4th-nav/utils"
)

func UpdateCategory(data types.UpdateCategoryDto) {
	err := repository.UpdateCategory(data)
	utils.CheckErr(err)
}

func AddCategory(data types.AddCategoryDto) {
	if data.Name == "" || strings.TrimSpace(data.Name) == "" {
		return
	}

	existingCategories := GetAllCategories()
	names := make([]string, 0, len(existingCategories))
	for _, category := range existingCategories {
		names = append(names, category.Name)
	}
	if utils.In(data.Name, names) {
		return
	}

	err := repository.CreateCategory(data)
	utils.CheckErr(err)
}

func DeleteCategory(id int) error {
	return repository.DeleteCategory(id)
}

func GetAllCategories() []types.Category {
	results, err := repository.GetAllCategories()
	utils.CheckErr(err)
	return results
}
