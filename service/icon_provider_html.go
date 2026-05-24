package service

import "github.com/4thHydrogen/4th-nav/types"

type HTMLProvider struct{}

func (p *HTMLProvider) Name() string { return "html" }

func (p *HTMLProvider) Enabled(_ *types.Setting) bool { return true }

func (p *HTMLProvider) Collect(rawURL string, _ *types.Setting) ([]IconCandidate, error) {
	return collectFromHTML(rawURL), nil
}
