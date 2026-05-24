package service

import (
	"fmt"
	"net/url"

	"github.com/4thHydrogen/4th-nav/types"
)

type BrandfetchProvider struct{}

func (p *BrandfetchProvider) Name() string { return "brandfetch" }

func (p *BrandfetchProvider) Enabled(setting *types.Setting) bool {
	if setting == nil {
		return false
	}
	return setting.EnableBrandfetch && setting.BrandfetchClientID != ""
}

func (p *BrandfetchProvider) Collect(rawURL string, setting *types.Setting) ([]IconCandidate, error) {
	if setting == nil {
		return nil, nil
	}

	host, err := extractHost(rawURL)
	if err != nil {
		return nil, err
	}

	apiURL := fmt.Sprintf("https://cdn.brandfetch.io/%s/type/icon?c=%s", host, setting.BrandfetchClientID)
	return []IconCandidate{{
		URL:    apiURL,
		Source: "brandfetch",
	}}, nil
}

func extractHost(rawURL string) (string, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("parse URL: %w", err)
	}
	return u.Hostname(), nil
}
