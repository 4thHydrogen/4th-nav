package utils

import (
	"fmt"
	"strings"
)

func ValidateSVG(content []byte) error {
	s := strings.ToLower(string(content))
	dangerous := []string{"<script", "javascript:", "onclick=", "onload=", "onerror=", "<foreignobject"}
	for _, d := range dangerous {
		if strings.Contains(s, d) {
			return fmt.Errorf("SVG 包含不安全内容: %s", d)
		}
	}
	return nil
}

func IsSVG(content []byte) bool {
	s := strings.TrimSpace(string(content))
	return strings.HasPrefix(s, "<svg") || strings.HasPrefix(s, "<?xml")
}
