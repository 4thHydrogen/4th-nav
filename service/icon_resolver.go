package service

import (
	"fmt"
	"io/fs"
	"log"
	"sort"
	"strings"
)

// staticFS holds the embedded public directory for local icon existence checks.
// Initialized via InitStaticFS from main.go, following the same pattern as database.InitDB().
var staticFS fs.FS

// InitStaticFS sets the embedded static file system for local icon validation.
func InitStaticFS(f fs.FS) {
	staticFS = f
}

func ResolveBestIcon(rawURL string, candidates []IconCandidate) (string, IconCandidate, error) {
	if len(candidates) == 0 {
		return "", IconCandidate{}, fmt.Errorf("no icon candidates")
	}

	ScoreCandidates(candidates, rawURL)
	sort.Slice(candidates, func(i, j int) bool { return candidates[i].Score > candidates[j].Score })

	for _, c := range candidates {
		if c.URL == "" {
			continue
		}

		// Local static icons: validate existence, then trust without remote checks.
		if !strings.HasPrefix(c.URL, "http://") && !strings.HasPrefix(c.URL, "https://") {
			if !localIconExists(c.URL) {
				log.Printf("[icon] local preset file missing: %s", c.URL)
				continue
			}
			return c.URL, c, nil
		}

		// Remote icons must pass quality check.
		if !checkIconQuality(c.URL) {
			log.Printf("[icon] quality check failed: %s (%s)", c.URL, c.Source)
			continue
		}

		// Cache the verified image so frontend /api/img can serve it.
		if _, err := FetchAndCacheImage(c.URL); err != nil {
			log.Printf("[icon] cache failed: %s (%s): %v", c.URL, c.Source, err)
			continue
		}

		return c.URL, c, nil
	}

	return "", IconCandidate{}, fmt.Errorf("no valid icon candidate")
}

// localIconExists checks whether a local static icon file exists in the embedded FS.
func localIconExists(path string) bool {
	if staticFS == nil {
		return true
	}
	_, err := fs.Stat(staticFS, strings.TrimPrefix(path, "/"))
	return err == nil
}

// isIconHealthy returns whether a logo value represents a usable icon.
// Empty logos are unhealthy; local paths are checked against the embedded FS;
// remote URLs are assumed healthy (validated during pipeline resolution).
func isIconHealthy(logo string) bool {
	if logo == "" {
		return false
	}
	if strings.HasPrefix(logo, "http://") || strings.HasPrefix(logo, "https://") {
		return true
	}
	return localIconExists(logo)
}
