package handler

import (
	"net/http"

	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/service"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/4thHydrogen/4th-nav/utils"

	"github.com/gin-gonic/gin"
)

func GetAdminAllDataHandler(c *gin.Context) {
	tools := service.GetAllTool()
	catelogs := service.GetAllCatelog()
	setting := service.GetSetting()
	siteConfig := service.GetSiteConfig()
	tokens := service.GetApiTokens()
	userId, ok := c.Get("uid")
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "不存在该用户！",
		})
		return
	}
	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"tools":      tools,
			"catelogs":   catelogs,
			"setting":    setting,
			"siteConfig": siteConfig,
			"user": gin.H{
				"name": c.GetString("username"),
				"id":   userId,
			},
			"tokens": tokens,
		},
	})
}

func UpdateSettingHandler(c *gin.Context) {
	var data types.Setting
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	logger.LogInfo("更新配置: %+v", data)
	err := service.UpdateSetting(data)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"success": true,
		"message": "更新配置成功",
	})
}

func UpdateSiteConfigHandler(c *gin.Context) {
	var data types.SiteConfig
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	logger.LogInfo("更新网站配置: %+v", data)
	err := service.UpdateSiteConfig(data)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"success": true,
		"message": "更新网站配置成功",
	})
}
