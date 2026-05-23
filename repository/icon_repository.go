package repository

import (
	"database/sql"
	"net/url"
	"time"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
)

func UpdateIconStatus(id int64, status string, errMsg string) error {
	_, err := database.DB.Exec(
		`UPDATE nav_table SET icon_status = ?, icon_error = ?, icon_updated_at = ? WHERE id = ?;`,
		status, errMsg, time.Now().Unix(), id,
	)
	return err
}

func GetImageByURL(rawURL string) (types.Img, bool, error) {
	encodedURL := url.QueryEscape(rawURL)

	var img types.Img
	err := database.DB.QueryRow(`SELECT id, url, value FROM nav_img WHERE url = ?;`, encodedURL).Scan(&img.Id, &img.Url, &img.Value)
	if err != nil {
		if err == sql.ErrNoRows {
			return types.Img{}, false, nil
		}
		return types.Img{}, false, err
	}

	return img, true, nil
}

func SaveImage(rawURL string, value string) error {
	encodedURL := url.QueryEscape(rawURL)

	var existingID int
	err := database.DB.QueryRow(`SELECT id FROM nav_img WHERE url = ?;`, encodedURL).Scan(&existingID)
	if err == nil {
		return nil
	}
	if err != sql.ErrNoRows {
		return err
	}

	_, err = database.DB.Exec(`INSERT INTO nav_img (url, value) VALUES (?, ?);`, encodedURL, value)
	return err
}
