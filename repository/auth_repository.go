package repository

import (
	"database/sql"
	"fmt"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
)

func GetActiveAPITokens() ([]types.Token, error) {
	rows, err := database.DB.Query(`SELECT id, name, value, disabled FROM nav_api_token WHERE disabled = 0;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]types.Token, 0)
	for rows.Next() {
		var token types.Token
		if err := rows.Scan(&token.Id, &token.Name, &token.Value, &token.Disabled); err != nil {
			return nil, err
		}
		results = append(results, token)
	}
	return results, nil
}

func ExistsActiveAPIToken(token string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`SELECT COUNT(*) FROM nav_api_token WHERE value = ? AND disabled = 0;`, token).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func GetUserByName(name string) (types.User, error) {
	var user types.User
	err := database.DB.QueryRow(`SELECT id, name, password FROM nav_user WHERE name = ?;`, name).Scan(&user.Id, &user.Name, &user.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			return types.User{}, nil
		}
		return types.User{}, err
	}
	return user, nil
}

func InsertAPIToken(data types.Token) error {
	_, err := database.DB.Exec(
		`INSERT INTO nav_api_token (id, name, value, disabled) VALUES (?, ?, ?, ?);`,
		data.Id, data.Name, data.Value, data.Disabled,
	)
	return err
}

func DisableAPIToken(id int) error {
	result, err := database.DB.Exec(`UPDATE nav_api_token SET disabled = 1 WHERE id = ?;`, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("api token %d not found", id)
	}
	return nil
}

func UpdateUser(data types.UpdateUserDto) error {
	_, err := database.DB.Exec(
		`UPDATE nav_user SET name = ?, password = ? WHERE id = ?;`,
		data.Name, data.Password, data.Id,
	)
	return err
}
