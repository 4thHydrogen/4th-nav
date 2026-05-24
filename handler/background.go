package handler

import (
	"net/http"

	"github.com/4thHydrogen/4th-nav/service"
	"github.com/4thHydrogen/4th-nav/types"

	"github.com/gin-gonic/gin"
)

func GetCurrentBackgroundHandler(c *gin.Context) {
	theme := c.Query("theme")
	result, err := service.GetCurrentBackground(theme)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": result})
}

func ServeBackgroundCacheHandler(c *gin.Context) {
	filename := c.Param("filename")
	filePath, err := service.GetBackgroundCacheFilePath(filename)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.Header("Cache-Control", "public, max-age=86400")
	c.File(filePath)
}

func RefreshBackgroundHandler(c *gin.Context) {
	var data types.BackgroundRefreshDto
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}

	result, err := service.RefreshBackground(data.Source, data.Theme)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": result})
}

func ClearBackgroundCacheHandler(c *gin.Context) {
	if err := service.ClearBackgroundCache(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "缓存已清空"})
}

func TestPexelsKeyHandler(c *gin.Context) {
	var data types.BackgroundTestKeyDto
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}

	if err := service.TestPexelsKey(data.Key); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "API Key 有效"})
}
