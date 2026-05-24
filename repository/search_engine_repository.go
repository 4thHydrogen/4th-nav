package repository

import (
	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
)

func GetAllSearchEngines() ([]types.SearchEngine, error) {
	rows, err := database.DB.Query(`
		SELECT id, name, baseUrl, queryParam, logo, sort, enabled
		FROM nav_search_engine
		ORDER BY sort ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]types.SearchEngine, 0)
	for rows.Next() {
		var engine types.SearchEngine
		if err := rows.Scan(&engine.Id, &engine.Name, &engine.BaseUrl, &engine.QueryParam, &engine.Logo, &engine.Sort, &engine.Enabled); err != nil {
			return nil, err
		}
		results = append(results, engine)
	}
	return results, nil
}

func GetEnabledSearchEngines() ([]types.SearchEngine, error) {
	rows, err := database.DB.Query(`
		SELECT id, name, baseUrl, queryParam, logo, sort, enabled
		FROM nav_search_engine
		WHERE enabled = 1
		ORDER BY sort ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]types.SearchEngine, 0)
	for rows.Next() {
		var engine types.SearchEngine
		if err := rows.Scan(&engine.Id, &engine.Name, &engine.BaseUrl, &engine.QueryParam, &engine.Logo, &engine.Sort, &engine.Enabled); err != nil {
			return nil, err
		}
		results = append(results, engine)
	}
	return results, nil
}

func AddSearchEngine(engine types.SearchEngine) (int64, error) {
	var maxSort int
	if err := database.DB.QueryRow(`SELECT COALESCE(MAX(sort), 0) FROM nav_search_engine`).Scan(&maxSort); err != nil {
		return 0, err
	}

	result, err := database.DB.Exec(
		`INSERT INTO nav_search_engine (name, baseUrl, queryParam, logo, sort, enabled) VALUES (?, ?, ?, ?, ?, ?)`,
		engine.Name, engine.BaseUrl, engine.QueryParam, engine.Logo, maxSort+1, engine.Enabled,
	)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func UpdateSearchEngine(engine types.SearchEngine) error {
	_, err := database.DB.Exec(
		`UPDATE nav_search_engine SET name = ?, baseUrl = ?, queryParam = ?, logo = ?, enabled = ? WHERE id = ?`,
		engine.Name, engine.BaseUrl, engine.QueryParam, engine.Logo, engine.Enabled, engine.Id,
	)
	return err
}

func DeleteSearchEngine(id int) error {
	_, err := database.DB.Exec(`DELETE FROM nav_search_engine WHERE id = ?`, id)
	return err
}

func UpdateSearchEngineSort(sortData []types.UpdateSearchEngineSortItem) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`UPDATE nav_search_engine SET sort = ? WHERE id = ?`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, item := range sortData {
		if _, err := stmt.Exec(item.Sort, item.Id); err != nil {
			return err
		}
	}

	return tx.Commit()
}
