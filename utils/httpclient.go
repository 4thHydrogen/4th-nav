package utils

import (
	"net/http"
	"net/url"
	"time"
)

// NewProxiedHttpClient creates an HTTP client with optional proxy.
// If proxyURL is empty, returns a default client (direct connection).
func NewProxiedHttpClient(proxyURL string, timeout time.Duration) *http.Client {
	transport := &http.Transport{}
	if proxyURL != "" {
		if proxyParsed, err := url.Parse(proxyURL); err == nil {
			transport.Proxy = http.ProxyURL(proxyParsed)
		}
	}
	return &http.Client{
		Transport: transport,
		Timeout:   timeout,
	}
}
