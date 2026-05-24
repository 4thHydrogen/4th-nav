package service

import "github.com/4thHydrogen/4th-nav/types"

type GoogleFaviconProvider struct{}

func (p *GoogleFaviconProvider) Name() string { return "google" }

func (p *GoogleFaviconProvider) Enabled(_ *types.Setting) bool { return true }

func (p *GoogleFaviconProvider) Collect(rawURL string, _ *types.Setting) ([]IconCandidate, error) {
	iconURL := fetchGoogleFavicon(rawURL)
	if iconURL == "" {
		return nil, nil
	}
	return []IconCandidate{{
		URL:    iconURL,
		Source: "google",
	}}, nil
}
