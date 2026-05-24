package service

import (
	"fmt"
	"log"
	"sort"
	"strings"
)

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

		// Local static icons are trusted without remote validation.
		if !strings.HasPrefix(c.URL, "http://") && !strings.HasPrefix(c.URL, "https://") {
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
