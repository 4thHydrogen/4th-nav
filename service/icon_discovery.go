package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/4thHydrogen/4th-nav/goscraper"
	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/utils"
)

type IconCandidate struct {
	URL    string
	Rel    string
	Type   string
	Sizes  string
	Width  int
	Height int
	Source string // html, manifest, probe, google, preset
	IsSVG  bool
	Score  int
}

// parseSizeString parses "192x192" or "512x512" into width, height.
func parseSizeString(s string) (int, int) {
	parts := strings.SplitN(strings.ToLower(s), "x", 2)
	if len(parts) != 2 {
		return 0, 0
	}
	var w, h int
	fmt.Sscanf(parts[0], "%d", &w)
	fmt.Sscanf(parts[1], "%d", &h)
	return w, h
}

// resolveURL resolves a possibly relative URL against a base URL.
func resolveURL(base, ref string) string {
	if ref == "" {
		return ""
	}
	if strings.HasPrefix(ref, "http://") || strings.HasPrefix(ref, "https://") {
		return ref
	}
	if strings.HasPrefix(ref, "//") {
		u, err := url.Parse(base)
		if err != nil {
			return ref
		}
		return u.Scheme + ":" + ref
	}
	baseURL, err := url.Parse(base)
	if err != nil {
		return ref
	}
	refURL, err := url.Parse(ref)
	if err != nil {
		return ref
	}
	return baseURL.ResolveReference(refURL).String()
}

// ScoreCandidates scores and sorts icon candidates, returning the best one.
// Scoring rules:
//   Source: SVG +100, manifest +90, apple-touch-icon +80, rel=icon +70, probe +60, google +30, og:image +10
//   Size: >=512 +50, >=256 +40, >=192 +35, >=128 +25, >=64 +10, <64 -50
//   Same origin: +10
func ScoreCandidates(candidates []IconCandidate, pageURL string) IconCandidate {
	if len(candidates) == 0 {
		return IconCandidate{}
	}

	pageOrigin := getOrigin(pageURL)

	for i := range candidates {
		c := &candidates[i]

		// Source score
		switch c.Source {
		case "preset":
			c.Score += 120
		case "brandfetch":
			c.Score += 105
		case "html":
			switch {
			case c.IsSVG:
				c.Score += 100
			case strings.Contains(c.Rel, "apple-touch-icon"):
				c.Score += 80
			case strings.Contains(c.Rel, "mask-icon"):
				c.Score += 75
			case strings.Contains(c.Rel, "icon"):
				c.Score += 70
			case strings.Contains(c.Rel, "og:image") || strings.Contains(c.Rel, "twitter:image"):
				c.Score += 10
			default:
				c.Score += 50
			}
		case "manifest":
			c.Score += 90
		case "probe":
			c.Score += 60
		case "google":
			c.Score += 30
		case "iconhorse":
			c.Score += 45
		}

		// SVG bonus
		if c.IsSVG {
			c.Score += 100
		}

		// Size score (use max dimension)
		maxDim := c.Width
		if c.Height > maxDim {
			maxDim = c.Height
		}
		switch {
		case maxDim >= 512:
			c.Score += 50
		case maxDim >= 256:
			c.Score += 40
		case maxDim >= 192:
			c.Score += 35
		case maxDim >= 128:
			c.Score += 25
		case maxDim >= 64:
			c.Score += 10
		case maxDim > 0:
			c.Score -= 50
		}

		// Same origin bonus
		iconOrigin := getOrigin(c.URL)
		if iconOrigin != "" && iconOrigin == pageOrigin {
			c.Score += 10
		}
	}

	// Find best candidate
	best := candidates[0]
	for _, c := range candidates[1:] {
		if c.Score > best.Score {
			best = c
		}
	}
	return best
}

func getOrigin(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}
	return fmt.Sprintf("%s://%s", u.Scheme, u.Host)
}

// normalizeURL ensures a URL has a scheme.
func normalizeURL(rawURL string) string {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return ""
	}
	if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		rawURL = "https://" + rawURL
	}
	return rawURL
}

// collectFromHTML scrapes a page and extracts all icon candidates from HTML tags.
func collectFromHTML(rawURL string) []IconCandidate {
	proxy := getProxyURL()
	normalized := normalizeURL(rawURL)
	u, err := url.Parse(normalized)
	if err != nil {
		return nil
	}
	s, err := goscraper.ScrapeWithProxy(u, 5, proxy)
	if err != nil {
		logger.LogInfo("collectFromHTML: scrape failed for %s: %s", normalized, err)
		return nil
	}

	var candidates []IconCandidate
	pageURL := s.Preview.Link

	// Parse all icon-related link tags from goscraper results
	for _, icon := range s.Preview.Icons {
		absURL := resolveURL(pageURL, icon.URL)
		c := IconCandidate{
			URL:    absURL,
			Source: "html",
			IsSVG:  isSvgUrl(absURL) || strings.Contains(strings.ToLower(icon.Type), "svg"),
		}
		rel := strings.ToLower(icon.Rel)
		switch {
		case strings.Contains(rel, "apple-touch-icon"):
			c.Rel = "apple-touch-icon"
		case strings.Contains(rel, "manifest"):
			c.Rel = "manifest"
		case strings.Contains(rel, "mask-icon"):
			c.Rel = "mask-icon"
		default:
			c.Rel = "icon"
		}
		// Parse size
		w, h := parseSizeString(icon.Sizes)
		c.Width, c.Height = w, h
		candidates = append(candidates, c)

		// If this is a manifest link, fetch the manifest
		if strings.Contains(rel, "manifest") {
			manifestURL := resolveURL(pageURL, icon.URL)
			manifestIcons := fetchManifestIcons(pageURL, manifestURL)
			candidates = append(candidates, manifestIcons...)
		}
	}

	// og:image as low-priority candidates
	for _, img := range s.Preview.Images {
		candidates = append(candidates, IconCandidate{
			URL:    resolveURL(pageURL, img),
			Rel:    "og:image",
			Source: "html",
		})
	}

	return candidates
}

// WebAppManifest represents a W3C Web App Manifest.
type WebAppManifest struct {
	Icons []ManifestIcon `json:"icons"`
}

// ManifestIcon represents an icon entry in the manifest.
type ManifestIcon struct {
	Src   string `json:"src"`
	Sizes string `json:"sizes"`
	Type  string `json:"type"`
}

// fetchManifestIcons fetches and parses a Web App Manifest.
func fetchManifestIcons(pageURL, manifestHref string) []IconCandidate {
	manifestURL := resolveURL(pageURL, manifestHref)
	if manifestURL == "" {
		return nil
	}

	client := utils.NewProxiedHttpClient(getProxyURL(), 5*time.Second)
	req, err := http.NewRequest("GET", manifestURL, nil)
	if err != nil {
		return nil
	}
	req.Header.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := client.Do(req)
	if err != nil {
		logger.LogInfo("fetchManifestIcons: failed for %s: %s", manifestURL, err)
		return nil
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil
	}

	data, err := io.ReadAll(io.LimitReader(resp.Body, 256*1024))
	if err != nil {
		return nil
	}

	var manifest WebAppManifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		return nil
	}

	var candidates []IconCandidate
	for _, icon := range manifest.Icons {
		absURL := resolveURL(manifestURL, icon.Src)
		w, h := parseSizeString(icon.Sizes)
		candidates = append(candidates, IconCandidate{
			URL:    absURL,
			Rel:    "manifest",
			Type:   icon.Type,
			Sizes:  icon.Sizes,
			Width:  w,
			Height: h,
			Source: "manifest",
			IsSVG:  strings.Contains(strings.ToLower(icon.Type), "svg") || isSvgUrl(absURL),
		})
	}
	return candidates
}

// probeCommonIconPaths probes common icon paths on the origin.
func probeCommonIconPathsEnhanced(rawURL string) []IconCandidate {
	normalized := normalizeURL(rawURL)
	u, err := url.Parse(normalized)
	if err != nil {
		return nil
	}
	baseURL := fmt.Sprintf("%s://%s", u.Scheme, u.Host)

	paths := []struct {
		path   string
		rel    string
		expect int // expected min width
	}{
		{"/favicon.svg", "icon", 0},
		{"/apple-touch-icon.png", "apple-touch-icon", 180},
		{"/apple-touch-icon-precomposed.png", "apple-touch-icon", 180},
		{"/apple-touch-icon-180x180.png", "apple-touch-icon", 180},
		{"/android-chrome-512x512.png", "manifest", 512},
		{"/android-chrome-192x192.png", "manifest", 192},
		{"/favicon-512x512.png", "icon", 512},
		{"/favicon-256x256.png", "icon", 256},
		{"/favicon-192x192.png", "icon", 192},
		{"/favicon-128x128.png", "icon", 128},
		{"/favicon-96x96.png", "icon", 96},
		{"/favicon-64x64.png", "icon", 64},
		{"/favicon-32x32.png", "icon", 32},
		{"/favicon.ico", "icon", 16},
		{"/mstile-310x310.png", "manifest", 310},
		{"/mstile-150x150.png", "manifest", 150},
	}

	client := utils.NewProxiedHttpClient(getProxyURL(), 5*time.Second)
	var candidates []IconCandidate

	for _, p := range paths {
		probeURL := baseURL + p.path
		req, err := http.NewRequest("HEAD", probeURL, nil)
		if err != nil {
			continue
		}
		req.Header.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
		resp, err := client.Do(req)
		if err != nil {
			continue
		}
		resp.Body.Close()
		if resp.StatusCode != 200 {
			continue
		}
		ct := strings.ToLower(resp.Header.Get("Content-Type"))
		if !strings.Contains(ct, "image") && !strings.Contains(ct, "svg") {
			continue
		}
		candidates = append(candidates, IconCandidate{
			URL:    probeURL,
			Rel:    p.rel,
			Source: "probe",
			IsSVG:  strings.Contains(ct, "svg") || isSvgUrl(probeURL),
			Width:  p.expect,
			Height: p.expect,
		})
	}
	return candidates
}

// guessSizeFromURL tries to extract dimensions from a URL like "favicon-192x192.png".
func guessSizeFromURL(rawURL string) (int, int) {
	// Look for patterns like 192x192, 512x512
	lower := strings.ToLower(rawURL)
	// Try common patterns
	for _, pattern := range []string{"512x512", "384x384", "256x256", "192x192", "180x180", "128x128", "96x96", "64x64", "32x32"} {
		if strings.Contains(lower, pattern) {
			return parseSizeString(pattern)
		}
	}
	return 0, 0
}

// DiscoverIconPipeline is the main entry point for icon discovery.
// It collects candidates from all registered providers, scores them,
// validates and caches the best one, then returns the final logo URL.
func DiscoverIconPipeline(rawURL string) (string, string) {
	setting := GetSetting()

	// Collect candidates from all registered providers
	candidates := CollectAll(rawURL, &setting)
	if len(candidates) == 0 {
		return "", ""
	}

	// Resolve: score → sort → validate → cache → return best
	logo, best, err := ResolveBestIcon(rawURL, candidates)
	if err != nil {
		logger.LogInfo("DiscoverIconPipeline: no valid icon for %s: %v", rawURL, err)
		return "", ""
	}

	logger.LogInfo("DiscoverIconPipeline: best candidate for %s is %s (score=%d, source=%s)",
		rawURL, best.URL, best.Score, best.Source)
	return logo, best.Source
}
