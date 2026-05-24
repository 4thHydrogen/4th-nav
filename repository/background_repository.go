package repository

import (
	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"
)

func GetValidCachedBackground(source string, theme string) (*types.BackgroundCache, error) {
	row := database.DB.QueryRow(`
		SELECT id, source, theme, filename, original_url, photographer, photographer_url,
		       photo_page_url, avg_color, content_type, file_size, expires_at, created_at
		FROM background_cache
		WHERE source = ? AND theme = ?
		  AND (expires_at = 0 OR expires_at > strftime('%s', 'now'))
		ORDER BY created_at DESC
		LIMIT 1;
	`, source, theme)

	var entry types.BackgroundCache
	err := row.Scan(
		&entry.Id, &entry.Source, &entry.Theme, &entry.Filename, &entry.OriginalUrl,
		&entry.Photographer, &entry.PhotographerUrl, &entry.PhotoPageUrl,
		&entry.AvgColor, &entry.ContentType, &entry.FileSize,
		&entry.ExpiresAt, &entry.CreatedAt,
	)
	if err != nil {
		return nil, nil // nolint:nilerr — no cache entry is not an error
	}
	return &entry, nil
}

func GetAllBackgroundCache() ([]types.BackgroundCache, error) {
	rows, err := database.DB.Query(`
		SELECT id, source, theme, filename, original_url, photographer, photographer_url,
		       photo_page_url, avg_color, content_type, file_size, expires_at, created_at
		FROM background_cache;
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []types.BackgroundCache
	for rows.Next() {
		var entry types.BackgroundCache
		if err := rows.Scan(
			&entry.Id, &entry.Source, &entry.Theme, &entry.Filename, &entry.OriginalUrl,
			&entry.Photographer, &entry.PhotographerUrl, &entry.PhotoPageUrl,
			&entry.AvgColor, &entry.ContentType, &entry.FileSize,
			&entry.ExpiresAt, &entry.CreatedAt,
		); err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}
	return entries, rows.Err()
}

func SaveBackgroundCache(entry *types.BackgroundCache) error {
	_, err := database.DB.Exec(`
		INSERT INTO background_cache (source, theme, filename, original_url, photographer,
		    photographer_url, photo_page_url, avg_color, content_type, file_size, expires_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
	`,
		entry.Source, entry.Theme, entry.Filename, entry.OriginalUrl,
		entry.Photographer, entry.PhotographerUrl, entry.PhotoPageUrl,
		entry.AvgColor, entry.ContentType, entry.FileSize, entry.ExpiresAt,
	)
	return err
}

func DeleteAllBackgroundCache() (int64, error) {
	result, err := database.DB.Exec(`DELETE FROM background_cache;`)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
