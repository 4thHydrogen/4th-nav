package service

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/utils"
)

// CachedImage holds a downloaded image and its metadata.
type CachedImage struct {
	Data        []byte
	ContentType string
}

// FetchAndCacheImage downloads an image from rawURL, validates it,
// writes to nav_img cache, and returns the image data.
func FetchAndCacheImage(rawURL string) (*CachedImage, error) {
	if rawURL == "" {
		return nil, fmt.Errorf("empty URL")
	}
	if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		return nil, fmt.Errorf("only http/https URLs allowed, got: %s", rawURL)
	}

	client := utils.NewProxiedHttpClient(getProxyURL(), 10*time.Second)
	req, err := http.NewRequest("GET", rawURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("status %d", resp.StatusCode)
	}

	ct := strings.ToLower(resp.Header.Get("Content-Type"))
	if !isImageContentType(ct) {
		return nil, fmt.Errorf("not an image content-type: %s", ct)
	}

	// Limit read to 2MB
	data, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
	if err != nil {
		return nil, fmt.Errorf("read body: %w", err)
	}
	if len(data) < 100 {
		return nil, fmt.Errorf("image too small: %d bytes", len(data))
	}

	// Write to nav_img cache
	urlEncoded := url.QueryEscape(rawURL)
	base64Value := base64.StdEncoding.EncodeToString(data)
	writeImgCache(urlEncoded, base64Value)

	return &CachedImage{
		Data:        data,
		ContentType: guessContentType(ct, rawURL),
	}, nil
}

func isImageContentType(ct string) bool {
	return strings.Contains(ct, "image/") ||
		strings.Contains(ct, "svg") ||
		strings.Contains(ct, "icon")
}

func guessContentType(ct string, rawURL string) string {
	if ct != "" {
		return ct
	}
	lower := strings.ToLower(rawURL)
	switch {
	case strings.Contains(lower, ".svg"):
		return "image/svg+xml"
	case strings.Contains(lower, ".png"):
		return "image/png"
	case strings.Contains(lower, ".jpg") || strings.Contains(lower, ".jpeg"):
		return "image/jpeg"
	case strings.Contains(lower, ".webp"):
		return "image/webp"
	case strings.Contains(lower, ".ico"):
		return "image/x-icon"
	default:
		return "image/png"
	}
}

// writeImgCache writes an entry to nav_img.
func writeImgCache(urlEncoded string, base64Value string) {
	sql_check := `SELECT id FROM nav_img WHERE url = ?;`
	rows, err := database.DB.Query(sql_check, urlEncoded)
	if err != nil {
		return
	}
	rows.Close()
	if !rows.Next() {
		sql_add := `INSERT INTO nav_img (url, value) VALUES (?, ?);`
		database.DB.Exec(sql_add, urlEncoded, base64Value)
	}
}
