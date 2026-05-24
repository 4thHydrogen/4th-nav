package service

import (
	"log"

	"github.com/4thHydrogen/4th-nav/types"
)

type IconProvider interface {
	Name() string
	Enabled(setting *types.Setting) bool
	Collect(rawURL string, setting *types.Setting) ([]IconCandidate, error)
}

var iconProviders []IconProvider

func init() {
	RegisterProvider(&LocalPresetProvider{})
	RegisterProvider(&BrandfetchProvider{})
	RegisterProvider(&HTMLProvider{})
	RegisterProvider(&ProbeProvider{})
	RegisterProvider(&IconHorseProvider{})
	RegisterProvider(&GoogleFaviconProvider{})
}

func RegisterProvider(p IconProvider) {
	iconProviders = append(iconProviders, p)
}

func CollectAll(rawURL string, setting *types.Setting) []IconCandidate {
	var all []IconCandidate
	for _, p := range iconProviders {
		if !p.Enabled(setting) {
			continue
		}
		candidates, err := p.Collect(rawURL, setting)
		if err != nil {
			log.Printf("[icon] provider %s error: %v", p.Name(), err)
			continue
		}
		all = append(all, candidates...)
	}
	return all
}
