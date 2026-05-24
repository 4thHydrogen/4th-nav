package service

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/repository"
	"github.com/4thHydrogen/4th-nav/types"
)

type IconJobStatus struct {
	Running   bool   `json:"running"`
	Total     int    `json:"total"`
	Done      int    `json:"done"`
	Success   int    `json:"success"`
	Failed    int    `json:"failed"`
	LastError string `json:"lastError"`
}

const iconWorkerCount = 4

var (
	iconJobMu     sync.Mutex
	iconJobStatus IconJobStatus
	iconHostMu    sync.Map // map[string]*sync.Mutex — per-host rate limiting
)

func GetIconJobStatus() IconJobStatus {
	iconJobMu.Lock()
	defer iconJobMu.Unlock()
	return iconJobStatus
}

// RefreshSingleIcon refreshes the icon for a single tool.
func RefreshSingleIcon(id int64, force bool) error {
	tool, err := getToolByID(id)
	if err != nil {
		return fmt.Errorf("tool not found: %w", err)
	}
	if tool.Type == "folder" {
		return fmt.Errorf("cannot refresh icon for folder")
	}
	if tool.Url == "" || tool.Url == "admin" {
		return fmt.Errorf("tool has no valid URL")
	}
	if force {
		UpdateToolIcon(id, "")
	}
	go LazyFetchLogo(tool.Url, id)
	return nil
}

// RefreshMissingIcons starts a background job to refresh icons for tools with empty logos.
func RefreshMissingIcons() error {
	iconJobMu.Lock()
	if iconJobStatus.Running {
		iconJobMu.Unlock()
		return fmt.Errorf("a job is already running")
	}
	iconJobStatus = IconJobStatus{Running: true}
	iconJobMu.Unlock()

	tools, err := GetAllTool()
	if err != nil {
		return fmt.Errorf("failed to get tools: %w", err)
	}
	var targets []types.Tool
	for _, t := range tools {
		if t.Type == "folder" || t.Url == "" || t.Url == "admin" {
			continue
		}
		if !isIconHealthy(t.Logo) {
			if t.Logo != "" {
				UpdateToolIcon(int64(t.Id), "")
			}
			targets = append(targets, t)
		}
	}

	go runIconJob(targets)
	return nil
}

// RefreshAllIcons starts a background job to refresh all tool icons.
func RefreshAllIcons(force bool, clearCache bool) error {
	iconJobMu.Lock()
	if iconJobStatus.Running {
		iconJobMu.Unlock()
		return fmt.Errorf("a job is already running")
	}
	iconJobStatus = IconJobStatus{Running: true}
	iconJobMu.Unlock()

	if clearCache {
		ClearIconCache("cache-only")
	}
	tools, err := GetAllTool()
	if err != nil {
		return fmt.Errorf("failed to get tools: %w", err)
	}
	var targets []types.Tool
	for _, t := range tools {
		if t.Type == "folder" || t.Url == "" || t.Url == "admin" {
			continue
		}
		if force {
			UpdateToolIcon(int64(t.Id), "")
		}
		if !isIconHealthy(t.Logo) || force {
			if !force && t.Logo != "" {
				UpdateToolIcon(int64(t.Id), "")
			}
			targets = append(targets, t)
		}
	}

	go runIconJob(targets)
	return nil
}

// ClearIconCache clears icon data based on mode.
func ClearIconCache(mode string) {
	switch mode {
	case "cache-only":
		if err := repository.ClearImageCache(); err != nil {
			logger.LogInfo("failed clearing nav_img cache: %s", err)
			return
		}
		logger.LogInfo("Cleared nav_img cache")
	case "logo-only":
		if err := repository.ClearAllToolLogos(); err != nil {
			logger.LogInfo("failed clearing nav_table.logo: %s", err)
			return
		}
		logger.LogInfo("Cleared nav_table.logo")
	case "cache-and-logo":
		if err := repository.ClearImageCache(); err != nil {
			logger.LogInfo("failed clearing nav_img cache: %s", err)
			return
		}
		if err := repository.ClearAllToolLogos(); err != nil {
			logger.LogInfo("failed clearing nav_table.logo: %s", err)
			return
		}
		logger.LogInfo("Cleared nav_img cache and nav_table.logo")
	}
}

func runIconJob(tools []types.Tool) {
	iconJobMu.Lock()
	iconJobStatus.Total = len(tools)
	iconJobStatus.Done = 0
	iconJobStatus.Success = 0
	iconJobStatus.Failed = 0
	iconJobStatus.LastError = ""
	iconJobMu.Unlock()

	jobs := make(chan types.Tool, len(tools))
	var wg sync.WaitGroup

	for i := 0; i < iconWorkerCount; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for tool := range jobs {
				// Per-host rate limiting
				host := getHostFromURL(tool.Url)
				if host != "" {
					hostMu, _ := iconHostMu.LoadOrStore(host, &sync.Mutex{})
					hostMu.(*sync.Mutex).Lock()
					time.Sleep(500 * time.Millisecond) // min interval between same-host requests
					hostMu.(*sync.Mutex).Unlock()
				}

				err := refreshSingleIconSync(tool)
				iconJobMu.Lock()
				iconJobStatus.Done++
				if err != nil {
					iconJobStatus.Failed++
					iconJobStatus.LastError = fmt.Sprintf("failed %s: %s", tool.Url, err.Error())
					logger.LogInfo("IconJob: failed for %s: %s", tool.Url, err)
				} else {
					iconJobStatus.Success++
				}
				iconJobMu.Unlock()
			}
		}()
	}

	for _, t := range tools {
		jobs <- t
	}
	close(jobs)
	wg.Wait()

	iconJobMu.Lock()
	iconJobStatus.Running = false
	iconJobMu.Unlock()
	logger.LogInfo("IconJob: completed %d/%d (success: %d, failed: %d)",
		iconJobStatus.Done, iconJobStatus.Total, iconJobStatus.Success, iconJobStatus.Failed)
}

func refreshSingleIconSync(tool types.Tool) error {
	// Use a timeout context approach via goroutine + channel
	done := make(chan error, 1)
	go func() {
		LazyFetchLogo(tool.Url, int64(tool.Id))
		updated, _ := getToolByID(int64(tool.Id))
		if updated.Logo == "" {
			done <- fmt.Errorf("no icon found")
		} else {
			done <- nil
		}
	}()

	select {
	case err := <-done:
		return err
	case <-time.After(20 * time.Second):
		return fmt.Errorf("timeout after 20s")
	}
}

func getHostFromURL(rawURL string) string {
	if !strings.HasPrefix(rawURL, "http") {
		rawURL = "https://" + rawURL
	}
	parts := strings.SplitN(strings.TrimPrefix(rawURL, "https://"), "/", 2)
	parts = strings.SplitN(strings.TrimPrefix(parts[0], "http://"), "/", 2)
	return parts[0]
}

// getToolByID fetches a single tool by ID.
func getToolByID(id int64) (types.Tool, error) {
	return repository.GetToolByID(id)
}
