package handler

import (
	"net/http"
	"strconv"

	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/service"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/4thHydrogen/4th-nav/utils"

	"github.com/gin-gonic/gin"
)

func ExportToolsHandler(c *gin.Context) {
	tools := service.GetAllTool()
	c.JSON(200, gin.H{
		"success": true,
		"message": "瀵煎嚭宸ュ叿鎴愬姛",
		"data":    tools,
	})
}

func ImportToolsHandler(c *gin.Context) {
	var tools []types.Tool
	err := c.ShouldBindJSON(&tools)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	service.ImportTools(tools)
	c.JSON(200, gin.H{
		"success": true,
		"message": "瀵煎叆宸ュ叿鎴愬姛",
	})
}

func AddToolHandler(c *gin.Context) {
	var data types.AddToolDto
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	logger.LogInfo("%s 鑾峰彇 logo: %s", data.Name, data.Logo)
	id, err := service.AddTool(data)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	if data.Logo == "" {
		go service.LazyFetchLogo(data.Url, id)
	}
	c.JSON(200, gin.H{
		"success": true,
		"message": "娣诲姞鎴愬姛",
		"data": gin.H{
			"id": id,
		},
	})
}

func DeleteToolHandler(c *gin.Context) {
	id := c.Param("id")
	numberID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "鏃犳晥 ID"})
		return
	}

	if err := service.DeleteTool(numberID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "鍒犻櫎鎴愬姛",
	})
}

func UpdateToolHandler(c *gin.Context) {
	var data types.UpdateToolDto
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	service.UpdateTool(data)
	if data.Logo == "" {
		logger.LogInfo("%s 鑾峰彇 logo: %s", data.Name, data.Logo)
		go service.LazyFetchLogo(data.Url, int64(data.Id))
	}
	c.JSON(200, gin.H{
		"success": true,
		"message": "鏇存柊鎴愬姛",
	})
}

func UpdateToolViewModeHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "鏃犳晥 ID"})
		return
	}
	var body struct {
		ViewMode string `json:"viewMode"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "鏃犳晥璇锋眰"})
		return
	}
	if err := service.UpdateToolViewMode(id, body.ViewMode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "甯冨眬鏇存柊鎴愬姛"})
}

func MoveToolToFolderHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "鏃犳晥 ID"})
		return
	}
	var body struct {
		ParentId *int `json:"parentId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "鏃犳晥璇锋眰"})
		return
	}

	if err := service.MoveToolToFolder(id, body.ParentId); err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "folders cannot be moved into another folder" {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "绉诲姩鎴愬姛"})
}

func UpdateFolderSettingsHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "鏃犳晥 ID"})
		return
	}
	var body struct {
		FolderViewMode string `json:"folderViewMode"`
		FolderItemSize int    `json:"folderItemSize"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "鏃犳晥璇锋眰"})
		return
	}
	if err := service.UpdateFolderSettings(id, body.FolderViewMode, body.FolderItemSize); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "鏂囦欢澶硅缃洿鏂版垚鍔?"})
}

func DeleteFolderHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "鏃犳晥 ID"})
		return
	}
	mode := c.DefaultQuery("mode", "move-children-to-root")
	if mode != "move-children-to-root" && mode != "delete-with-children" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "鏃犳晥鐨勫垹闄ゆā寮?"})
		return
	}
	if err := service.DeleteFolder(id, mode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "鍒犻櫎鏂囦欢澶规垚鍔?"})
}

func UpdateLayoutHandler(c *gin.Context) {
	var data types.UpdateLayoutDto
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	if err := service.UpdateLayout(data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "甯冨眬鏇存柊鎴愬姛"})
}

func UpdateToolsSortHandler(c *gin.Context) {
	var updates []types.UpdateToolsSortDto
	if err := c.ShouldBindJSON(&updates); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	err := service.UpdateToolsSort(updates)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "更新排序成功",
	})
}

// IconRefreshHandler refreshes icon for a single tool.
func IconRefreshHandler(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "鏃犳晥 ID"})
		return
	}
	var body struct {
		Force bool `json:"force"`
	}
	c.ShouldBindJSON(&body)
	if err := service.RefreshSingleIcon(id, body.Force); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "icon refresh started"})
}

// IconsRefreshMissingHandler starts a job to refresh icons for tools with empty logos.
func IconsRefreshMissingHandler(c *gin.Context) {
	if err := service.RefreshMissingIcons(); err != nil {
		c.JSON(http.StatusConflict, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "refresh missing icons started"})
}

// IconsRefreshAllHandler starts a job to refresh all tool icons.
func IconsRefreshAllHandler(c *gin.Context) {
	var body struct {
		ClearCache bool `json:"clearCache"`
		Force      bool `json:"force"`
	}
	c.ShouldBindJSON(&body)
	if err := service.RefreshAllIcons(body.Force, body.ClearCache); err != nil {
		c.JSON(http.StatusConflict, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "refresh all icons started"})
}

// IconsClearCacheHandler clears icon cache.
func IconsClearCacheHandler(c *gin.Context) {
	var body struct {
		Mode string `json:"mode"`
	}
	c.ShouldBindJSON(&body)
	if body.Mode == "" {
		body.Mode = "cache-only"
	}
	service.ClearIconCache(body.Mode)
	c.JSON(200, gin.H{"success": true, "message": "icon cache cleared"})
}

// IconsStatusHandler returns current icon job status.
func IconsStatusHandler(c *gin.Context) {
	status := service.GetIconJobStatus()
	c.JSON(200, gin.H{"success": true, "data": status})
}

func UpdateUserHandler(c *gin.Context) {
	var data types.UpdateUserDto
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	service.UpdateUser(data)
	c.JSON(200, gin.H{
		"success": true,
		"message": "鏇存柊鐢ㄦ埛鎴愬姛",
	})
}
