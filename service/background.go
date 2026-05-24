package service

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/repository"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/4thHydrogen/4th-nav/utils"
	"github.com/google/uuid"
)

const (
	maxImageSize      = 30 * 1024 * 1024 // 30MB
	cacheDir          = "./data/background-cache"
	bingWallpaperURL  = "https://bing.biturl.top/?resolution=3840&format=image"
	defaultPexelsPage = 3
)

type pexelsAttribution struct {
	Photographer    string
	PhotographerUrl string
	PhotoPageUrl    string
	AvgColor        string
}

type pexelsPhoto struct {
	Src struct {
		Original string `json:"original"`
	} `json:"src"`
	Photographer    string `json:"photographer"`
	PhotographerUrl string `json:"photographer_url"`
	Url             string `json:"url"`
	AvgColor        string `json:"avg_color"`
}

type pexelsSearchResponse struct {
	Photos []pexelsPhoto `json:"photos"`
}

// GetCurrentBackground returns the locally cached background for the current settings + theme.
// Returns nil without error if no valid cache exists.
func GetCurrentBackground(theme string) (*types.ResolvedBackground, error) {
	setting := GetSetting()
	if setting.BackgroundUrl == "" {
		return nil, nil
	}

	if theme == "" {
		theme = "light"
	}

	entry, err := repository.GetValidCachedBackground(setting.BackgroundUrl, theme)
	if err != nil {
		return nil, fmt.Errorf("query cache: %w", err)
	}
	if entry == nil {
		return nil, nil
	}

	filePath := filepath.Join(cacheDir, entry.Filename)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, nil
	}

	return &types.ResolvedBackground{
		LocalUrl:        "/api/background/cache/" + entry.Filename,
		OriginalUrl:     entry.OriginalUrl,
		Photographer:    entry.Photographer,
		PhotographerUrl: entry.PhotographerUrl,
		PhotoPageUrl:    entry.PhotoPageUrl,
		AvgColor:        entry.AvgColor,
	}, nil
}

// RefreshBackground downloads and caches a background image.
// If source is empty, reads from settings. If theme is empty, defaults to "light".
func RefreshBackground(source string, theme string) (*types.ResolvedBackground, error) {
	if source == "" {
		setting := GetSetting()
		source = setting.BackgroundUrl
	}
	if source == "" {
		return nil, fmt.Errorf("no background source configured")
	}
	if theme == "" {
		theme = "light"
	}

	sourceType := determineSourceType(source)

	var remoteUrl string
	var attr pexelsAttribution
	var err error

	switch sourceType {
	case "pexels":
		remoteUrl, attr, err = resolvePexelsUrl(source, theme)
	case "bing":
		remoteUrl, err = resolveBingUrl()
	default:
		remoteUrl, err = resolveRemoteUrl(source)
	}
	if err != nil {
		return nil, err
	}

	entry, err := downloadAndCache(remoteUrl, source, theme, attr)
	if err != nil {
		return nil, err
	}

	logger.LogInfo("背景缓存已刷新: %s -> %s", source, entry.Filename)

	return &types.ResolvedBackground{
		LocalUrl:        "/api/background/cache/" + entry.Filename,
		OriginalUrl:     entry.OriginalUrl,
		Photographer:    entry.Photographer,
		PhotographerUrl: entry.PhotographerUrl,
		PhotoPageUrl:    entry.PhotoPageUrl,
		AvgColor:        entry.AvgColor,
	}, nil
}

// TestPexelsKey tests whether a Pexels API key is valid.
func TestPexelsKey(key string) error {
	client := utils.NewProxiedHttpClient(getProxyURL(), 15*time.Second)
	req, err := http.NewRequest("GET", "https://api.pexels.com/v1/search?query=test&per_page=1", nil)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", key)

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("API returned status %d", resp.StatusCode)
	}
	return nil
}

// ClearBackgroundCache removes all cached background images.
func ClearBackgroundCache() error {
	entries, err := repository.GetAllBackgroundCache()
	if err != nil {
		return fmt.Errorf("query cache: %w", err)
	}

	var deleted int
	for _, entry := range entries {
		path := filepath.Join(cacheDir, entry.Filename)
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			logger.LogError("删除缓存文件失败 %s: %s", entry.Filename, err)
			continue
		}
		deleted++
	}

	deletedRows, err := repository.DeleteAllBackgroundCache()
	if err != nil {
		return fmt.Errorf("delete cache records: %w", err)
	}

	logger.LogInfo("背景缓存已清理: 删除 %d 个文件, %d 条记录", deleted, deletedRows)
	return nil
}

// GetBackgroundCacheFilePath returns the full path for a cached background file.
// Validates against path traversal attacks.
func GetBackgroundCacheFilePath(filename string) (string, error) {
	if strings.Contains(filename, "/") || strings.Contains(filename, "\\") || strings.Contains(filename, "..") {
		return "", fmt.Errorf("invalid filename")
	}

	path := filepath.Join(cacheDir, filename)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return "", fmt.Errorf("file not found")
	}
	return path, nil
}

func determineSourceType(source string) string {
	lower := strings.ToLower(strings.TrimSpace(source))
	if lower == "pexels" || strings.HasPrefix(lower, "pexels:") {
		return "pexels"
	}
	if lower == "bing" || strings.Contains(lower, "bing.com") {
		return "bing"
	}
	return "remote"
}

func resolvePexelsUrl(source string, theme string) (string, pexelsAttribution, error) {
	var attr pexelsAttribution

	setting := GetSetting()
	apiKey := setting.PexelsApiKey
	if apiKey == "" {
		return "", attr, fmt.Errorf("Pexels API key not configured")
	}

	query := extractPexelsQuery(source)
	if query == "" {
		if theme == "dark" {
			query = "nature dark"
		} else {
			query = "nature light"
		}
	}

	params := url.Values{
		"query":       {query},
		"orientation": {"landscape"},
		"size":        {"large"},
		"per_page":    {"30"},
		"page":        {fmt.Sprintf("%d", rand.Intn(defaultPexelsPage)+1)},
	}

	apiURL := "https://api.pexels.com/v1/search?" + params.Encode()

	client := utils.NewProxiedHttpClient(getProxyURL(), 15*time.Second)
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return "", attr, fmt.Errorf("create pexels request: %w", err)
	}
	req.Header.Set("Authorization", apiKey)

	resp, err := client.Do(req)
	if err != nil {
		return "", attr, fmt.Errorf("pexels request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", attr, fmt.Errorf("pexels API returned status %d", resp.StatusCode)
	}

	var data pexelsSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return "", attr, fmt.Errorf("decode pexels response: %w", err)
	}

	if len(data.Photos) == 0 {
		return "", attr, fmt.Errorf("no photos found for query: %s", query)
	}

	photo := data.Photos[rand.Intn(len(data.Photos))]
	attr = pexelsAttribution{
		Photographer:    photo.Photographer,
		PhotographerUrl: photo.PhotographerUrl,
		PhotoPageUrl:    photo.Url,
		AvgColor:        photo.AvgColor,
	}

	return photo.Src.Original, attr, nil
}

func extractPexelsQuery(source string) string {
	lower := strings.ToLower(strings.TrimSpace(source))
	if lower == "pexels" {
		return ""
	}
	if strings.HasPrefix(lower, "pexels:") {
		return strings.TrimSpace(source[7:])
	}
	return ""
}

func resolveBingUrl() (string, error) {
	client := utils.NewProxiedHttpClient(getProxyURL(), 15*time.Second)
	resp, err := client.Get(bingWallpaperURL)
	if err != nil {
		return "", fmt.Errorf("bing request failed: %w", err)
	}
	defer resp.Body.Close()

	finalURL := resp.Request.URL.String()
	if finalURL == "" || finalURL == bingWallpaperURL {
		return "", fmt.Errorf("bing returned no image URL")
	}

	return finalURL, nil
}

func resolveRemoteUrl(source string) (string, error) {
	parsed, err := url.Parse(source)
	if err != nil {
		return "", fmt.Errorf("invalid URL: %w", err)
	}

	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return "", fmt.Errorf("only http/https URLs allowed")
	}

	host := parsed.Hostname()
	if isPrivateIP(host) {
		return "", fmt.Errorf("private IP addresses are not allowed")
	}

	return source, nil
}

func isPrivateIP(host string) bool {
	if host == "localhost" || host == "0.0.0.0" || host == "127.0.0.1" {
		return true
	}

	ip := net.ParseIP(host)
	if ip == nil {
		return false
	}

	privateRanges := []struct {
		network *net.IPNet
	}{
		{mustParseCIDR("127.0.0.0/8")},
		{mustParseCIDR("10.0.0.0/8")},
		{mustParseCIDR("172.16.0.0/12")},
		{mustParseCIDR("192.168.0.0/16")},
		{mustParseCIDR("::1/128")},
		{mustParseCIDR("fc00::/7")},
	}

	for _, r := range privateRanges {
		if r.network.Contains(ip) {
			return true
		}
	}
	return false
}

func mustParseCIDR(s string) *net.IPNet {
	_, network, err := net.ParseCIDR(s)
	if err != nil {
		panic(err)
	}
	return network
}

func downloadAndCache(remoteUrl string, source string, theme string, attr pexelsAttribution) (*types.BackgroundCache, error) {
	client := utils.NewProxiedHttpClient(getProxyURL(), 30*time.Second)
	req, err := http.NewRequest("GET", remoteUrl, nil)
	if err != nil {
		return nil, fmt.Errorf("create download request: %w", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("download failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("download returned status %d", resp.StatusCode)
	}

	ct := strings.ToLower(resp.Header.Get("Content-Type"))
	if !isWallpaperContentType(ct) {
		return nil, fmt.Errorf("invalid content type: %s", ct)
	}

	data, err := io.ReadAll(io.LimitReader(resp.Body, maxImageSize+1))
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}
	if len(data) > maxImageSize {
		return nil, fmt.Errorf("image exceeds %d bytes limit", maxImageSize)
	}
	if len(data) < 100 {
		return nil, fmt.Errorf("image too small: %d bytes", len(data))
	}

	ext := contentTypeToExt(ct)
	filename := uuid.New().String() + ext
	filePath := filepath.Join(cacheDir, filename)

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return nil, fmt.Errorf("write file: %w", err)
	}

	entry := &types.BackgroundCache{
		Source:          source,
		Theme:           theme,
		Filename:        filename,
		OriginalUrl:     remoteUrl,
		Photographer:    attr.Photographer,
		PhotographerUrl: attr.PhotographerUrl,
		PhotoPageUrl:    attr.PhotoPageUrl,
		AvgColor:        attr.AvgColor,
		ContentType:     ct,
		FileSize:        len(data),
	}

	if err := repository.SaveBackgroundCache(entry); err != nil {
		os.Remove(filePath)
		return nil, fmt.Errorf("save cache record: %w", err)
	}

	return entry, nil
}

func isWallpaperContentType(ct string) bool {
	return strings.Contains(ct, "image/jpeg") ||
		strings.Contains(ct, "image/png") ||
		strings.Contains(ct, "image/webp")
}

func contentTypeToExt(ct string) string {
	if strings.Contains(ct, "image/png") {
		return ".png"
	}
	if strings.Contains(ct, "image/webp") {
		return ".webp"
	}
	return ".jpg"
}
