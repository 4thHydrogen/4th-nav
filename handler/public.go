package handler

import (
	"encoding/base64"
	"net/http"
	"strings"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/service"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/4thHydrogen/4th-nav/utils"

	"github.com/gin-gonic/gin"
)

func GetAllHandler(c *gin.Context) {
	tools := service.GetAllTool()
	catelogs := service.GetAllCategories()
	if !utils.IsLogin(c) {
		tools = utils.FilterHideTools(tools, catelogs)
	}
	if !utils.IsLogin(c) {
		catelogs = utils.FilterHideCates(catelogs)
	}
	setting := service.GetSetting()
	siteConfig := service.GetSiteConfig()
	dockItems, err := service.GetDockItems()
	if err != nil || dockItems == nil {
		dockItems = []types.DockItem{}
	}
	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"tools":      tools,
			"catelogs":   catelogs,
			"setting":    setting,
			"siteConfig": siteConfig,
			"dockItems":  dockItems,
		},
	})
}

func GetLogoImgHandler(c *gin.Context) {
	imgURL := c.Query("url")
	if imgURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "URL参数不能为空",
		})
		return
	}
	img := service.GetImgFromDB(imgURL)

	// Cache miss: try to fetch and cache the image
	if img.Value == "" {
		cached, err := service.FetchAndCacheImage(imgURL)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"success":      false,
				"errorMessage": "未找到图片",
			})
			return
		}
		contentType := cached.ContentType
		if contentType == "" {
			contentType = guessImgContentType(imgURL)
		}
		c.Data(http.StatusOK, contentType, cached.Data)
		return
	}

	imgBuffer, err := base64.StdEncoding.DecodeString(img.Value)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": "图片解码失败",
		})
		return
	}
	contentType := guessImgContentType(imgURL)
	c.Data(http.StatusOK, contentType, imgBuffer)
}

func guessImgContentType(imgURL string) string {
	lower := strings.ToLower(imgURL)
	switch {
	case strings.Contains(lower, ".svg"):
		return "image/svg+xml"
	case strings.Contains(lower, ".png"):
		return "image/png"
	case strings.Contains(lower, ".jpg") || strings.Contains(lower, ".jpeg"):
		return "image/jpeg"
	case strings.Contains(lower, ".webp"):
		return "image/webp"
	default:
		return "image/x-icon"
	}
}

func ManifastHanlder(c *gin.Context) {
	setting := service.GetSetting()
	title := setting.Title

	logo192 := setting.Logo192
	if logo192 == "" {
		logo192 = "logo192.png"
	}

	logo512 := setting.Logo512
	if logo512 == "" {
		logo512 = "logo512.png"
	}

	icons := []gin.H{
		{"src": logo192, "type": "image/png", "sizes": "192x192"},
		{"src": logo512, "type": "image/png", "sizes": "512x512"},
	}

	if title == "" {
		title = "4th Nav"
	}
	c.JSON(200, gin.H{
		"short_name":       title,
		"name":             title,
		"icons":            icons,
		"start_url":        "/",
		"display":          "standalone",
		"scope":            "/",
		"theme_color":      "#000000",
		"background_color": "#ffffff",
	})
}

func GetEnabledSearchEnginesHandler(c *gin.Context) {
	engines, err := database.GetEnabledSearchEngines()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"success": true,
		"data":    engines,
	})
}
