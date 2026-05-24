package types

import (
	"fmt"
	"strconv"
	"strings"
)

func NormalizeViewMode(v string) string {
	if v == "card" {
		return "card"
	}
	return "icon"
}

func NormalizeFolderViewMode(v string) string {
	if v == "list" {
		return "list"
	}
	return "grid"
}

func NormalizeFolderItemSize(v int) int {
	if v < 20 {
		return 20
	}
	if v > 48 {
		return 48
	}
	return v
}

func NormalizeToolType(v string) string {
	if v == "folder" {
		return "folder"
	}
	return "icon"
}

func NormalizeToolSize(v string) string {
	parts := strings.Split(v, "x")
	if len(parts) != 2 {
		return "1x1"
	}
	w, err1 := strconv.Atoi(parts[0])
	h, err2 := strconv.Atoi(parts[1])
	if err1 != nil || err2 != nil || w < 1 || h < 1 || w > 6 || h > 6 {
		return "1x1"
	}
	return fmt.Sprintf("%dx%d", w, h)
}

func NormalizeGrid(v int) int {
	if v < 0 {
		return -1
	}
	return v
}
