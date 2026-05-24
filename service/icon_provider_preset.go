package service

import "github.com/4thHydrogen/4th-nav/types"

type LocalPresetProvider struct{}

func (p *LocalPresetProvider) Name() string { return "preset" }

func (p *LocalPresetProvider) Enabled(_ *types.Setting) bool { return true }

func (p *LocalPresetProvider) Collect(rawURL string, _ *types.Setting) ([]IconCandidate, error) {
	icon := MatchBrandPreset(rawURL)
	if icon == "" {
		return nil, nil
	}
	return []IconCandidate{{
		URL:    icon,
		Source: "preset",
	}}, nil
}
