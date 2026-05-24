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
		"message": "导出工具成功",
		"data":    tools,
	})
}

func ImportToolsHandler(c *gin.Context) {
	var tools []types.Tool
	if err := c.ShouldBindJSON(&tools); err != nil {
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
		"message": "导入工具成功",
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

	logger.LogInfo("%s logo: %s", data.Name, data.Logo)
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
		"message": "新增工具成功",
		"data": gin.H{
			"id": id,
		},
	})
}

func DeleteToolHandler(c *gin.Context) {
	numberID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的工具 ID",
		})
		return
	}

	if err := service.DeleteTool(numberID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "删除工具成功",
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
		logger.LogInfo("%s logo: %s", data.Name, data.Logo)
		go service.LazyFetchLogo(data.Url, int64(data.Id))
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "更新工具成功",
	})
}

func UpdateToolViewModeHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的工具 ID",
		})
		return
	}

	var body struct {
		ViewMode string `json:"viewMode"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的请求参数",
		})
		return
	}

	if err := service.UpdateToolViewMode(id, body.ViewMode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "视图模式更新成功"})
}

func MoveToolToFolderHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的工具 ID",
		})
		return
	}

	var body struct {
		ParentId *int `json:"parentId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的请求参数",
		})
		return
	}

	if err := service.MoveToolToFolder(id, body.ParentId); err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "folders cannot be moved into another folder" {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "移动工具成功"})
}

func UpdateFolderSettingsHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的文件夹 ID",
		})
		return
	}

	var body struct {
		FolderViewMode string `json:"folderViewMode"`
		FolderItemSize int    `json:"folderItemSize"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的请求参数",
		})
		return
	}

	if err := service.UpdateFolderSettings(id, body.FolderViewMode, body.FolderItemSize); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "文件夹设置更新成功"})
}

func DeleteFolderHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的文件夹 ID",
		})
		return
	}

	mode := c.DefaultQuery("mode", "move-children-to-root")
	if mode != "move-children-to-root" && mode != "delete-with-children" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的删除模式",
		})
		return
	}

	if err := service.DeleteFolder(id, mode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "删除文件夹成功"})
}

func UpdateLayoutHandler(c *gin.Context) {
	var data types.UpdateLayoutDto
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	if err := service.UpdateLayout(data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "布局更新成功"})
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

	if err := service.UpdateToolsSort(updates); err != nil {
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

func IconRefreshHandler(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的工具 ID",
		})
		return
	}

	var body struct {
		Force bool `json:"force"`
	}
	c.ShouldBindJSON(&body)

	if err := service.RefreshSingleIcon(id, body.Force); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "图标刷新任务已开始"})
}

func IconsRefreshMissingHandler(c *gin.Context) {
	if err := service.RefreshMissingIcons(); err != nil {
		c.JSON(http.StatusConflict, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "缺失图标刷新任务已开始"})
}

func IconsRefreshAllHandler(c *gin.Context) {
	var body struct {
		ClearCache bool `json:"clearCache"`
		Force      bool `json:"force"`
	}
	c.ShouldBindJSON(&body)

	if err := service.RefreshAllIcons(body.Force, body.ClearCache); err != nil {
		c.JSON(http.StatusConflict, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "全量图标刷新任务已开始"})
}

func IconsClearCacheHandler(c *gin.Context) {
	var body struct {
		Mode string `json:"mode"`
	}
	c.ShouldBindJSON(&body)
	if body.Mode == "" {
		body.Mode = "cache-only"
	}

	service.ClearIconCache(body.Mode)
	c.JSON(200, gin.H{"success": true, "message": "图标缓存已清空"})
}

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
		"message": "更新用户信息成功",
	})
}
