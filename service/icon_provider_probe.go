package service

import "github.com/4thHydrogen/4th-nav/types"

type ProbeProvider struct{}

func (p *ProbeProvider) Name() string { return "probe" }

func (p *ProbeProvider) Enabled(_ *types.Setting) bool { return true }

func (p *ProbeProvider) Collect(rawURL string, _ *types.Setting) ([]IconCandidate, error) {
	candidates := probeCommonIconPathsEnhanced(rawURL)
	return candidates, nil
}
