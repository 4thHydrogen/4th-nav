package service

import (
	"github.com/4thHydrogen/4th-nav/repository"
	"github.com/4thHydrogen/4th-nav/types"
)

func GetAllSearchEngines() ([]types.SearchEngine, error) {
	return repository.GetAllSearchEngines()
}

func GetEnabledSearchEngines() ([]types.SearchEngine, error) {
	return repository.GetEnabledSearchEngines()
}

func AddSearchEngine(data types.SearchEngine) (int64, error) {
	return repository.AddSearchEngine(data)
}

func UpdateSearchEngine(data types.SearchEngine) error {
	return repository.UpdateSearchEngine(data)
}

func DeleteSearchEngine(id int) error {
	return repository.DeleteSearchEngine(id)
}

func UpdateSearchEngineSort(sortData []types.UpdateSearchEngineSortItem) error {
	return repository.UpdateSearchEngineSort(sortData)
}
