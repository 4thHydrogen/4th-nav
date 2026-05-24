package service

import (
	"fmt"

	"github.com/4thHydrogen/4th-nav/types"
)

type IconHorseProvider struct{}

func (p *IconHorseProvider) Name() string { return "iconhorse" }

func (p *IconHorseProvider) Enabled(setting *types.Setting) bool {
	if setting == nil {
		return false
	}
	return setting.EnableIconHorse
}

func (p *IconHorseProvider) Collect(rawURL string, _ *types.Setting) ([]IconCandidate, error) {
	host, err := extractHost(rawURL)
	if err != nil {
		return nil, err
	}

	apiURL := fmt.Sprintf("https://icon.horse/icon/%s", host)
	return []IconCandidate{{
		URL:    apiURL,
		Source: "iconhorse",
	}}, nil
}
