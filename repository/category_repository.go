package repository

import (
	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
)

func GetAllCategories() ([]types.Category, error) {
	rows, err := database.DB.Query(`SELECT id, name, sort, hide FROM nav_catelog ORDER BY sort;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]types.Category, 0)
	for rows.Next() {
		var category types.Category
		if err := rows.Scan(&category.Id, &category.Name, &category.Sort, &category.Hide); err != nil {
			return nil, err
		}
		results = append(results, category)
	}
	return results, nil
}

func CreateCategory(data types.AddCategoryDto) error {
	_, err := database.DB.Exec(
		`INSERT INTO nav_catelog (name, sort, hide) VALUES (?, ?, ?);`,
		data.Name, data.Sort, data.Hide,
	)
	return err
}

func UpdateCategory(data types.UpdateCategoryDto) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	var oldName string
	if err = tx.QueryRow(`SELECT name FROM nav_catelog WHERE id = ?;`, data.Id).Scan(&oldName); err != nil {
		return err
	}

	if _, err = tx.Exec(
		`UPDATE nav_catelog SET name = ?, sort = ?, hide = ? WHERE id = ?;`,
		data.Name, data.Sort, data.Hide, data.Id,
	); err != nil {
		return err
	}

	if oldName != data.Name {
		if _, err = tx.Exec(`UPDATE nav_table SET catelog = ? WHERE catelog = ?;`, data.Name, oldName); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func DeleteCategory(id int) error {
	_, err := database.DB.Exec(`DELETE FROM nav_catelog WHERE id = ?;`, id)
	return err
}
