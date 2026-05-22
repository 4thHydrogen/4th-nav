package handler

import (
	"net/http"
	"net/url"
	"strconv"

	"github.com/4thHydrogen/4th-nav/database"
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

	logger.LogInfo("%s 获取 logo: %s", data.Name, data.Logo)
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
		"message": "添加成功",
		"data": gin.H{
			"id": id,
		},
	})
}

func DeleteToolHandler(c *gin.Context) {
	id := c.Param("id")
	numberId, err := strconv.Atoi(id)
	utils.CheckErr(err)

	var parentId *int
	database.DB.QueryRow(`SELECT parent_id FROM nav_table WHERE id = ?`, numberId).Scan(&parentId)

	sql_delete_tool := `DELETE FROM nav_table WHERE id = ?;`
	stmt, err := database.DB.Prepare(sql_delete_tool)
	utils.CheckErr(err)
	res, err := stmt.Exec(id)
	utils.CheckErr(err)
	_, err = res.RowsAffected()
	utils.CheckErr(err)

	database.DB.Exec(`DELETE FROM dock_items WHERE tool_id = ?`, numberId)
	url1 := service.GetToolLogoUrlById(numberId)
	urlEncoded := url.QueryEscape(url1)
	sql_delete_tool_img := `DELETE FROM nav_img WHERE url = ?;`
	stmt, err = database.DB.Prepare(sql_delete_tool_img)
	utils.CheckErr(err)
	res, err = stmt.Exec(urlEncoded)
	utils.CheckErr(err)
	_, err = res.RowsAffected()
	utils.CheckErr(err)

	if parentId != nil {
		var childCount int
		err := database.DB.QueryRow(`SELECT COUNT(*) FROM nav_table WHERE parent_id = ?`, *parentId).Scan(&childCount)
		if err == nil && childCount == 0 {
			database.DB.Exec(`DELETE FROM nav_table WHERE id = ? AND type = 'folder'`, *parentId)
			database.DB.Exec(`DELETE FROM dock_items WHERE tool_id = ?`, *parentId)
			logger.LogInfo("空文件夹自动删除: folderId=%d", *parentId)
		}
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "删除成功",
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
		logger.LogInfo("%s 获取 logo: %s", data.Name, data.Logo)
		go service.LazyFetchLogo(data.Url, int64(data.Id))
	}
	c.JSON(200, gin.H{
		"success": true,
		"message": "更新成功",
	})
}

func UpdateToolViewModeHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "无效 ID"})
		return
	}
	var body struct {
		ViewMode string `json:"viewMode"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "无效请求"})
		return
	}
	if err := service.UpdateToolViewMode(id, body.ViewMode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "布局更新成功"})
}

func MoveToolToFolderHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "无效 ID"})
		return
	}
	var body struct {
		ParentId *int `json:"parentId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "无效请求"})
		return
	}

	if body.ParentId != nil {
		var toolType string
		database.DB.QueryRow(`SELECT type FROM nav_table WHERE id = ?`, id).Scan(&toolType)
		if toolType == "folder" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "文件夹不能嵌套"})
			return
		}
	}

	var oldParentId *int
	if body.ParentId == nil {
		database.DB.QueryRow(`SELECT parent_id FROM nav_table WHERE id = ?`, id).Scan(&oldParentId)
	}

	if err := service.MoveToolToFolder(id, body.ParentId); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}

	if oldParentId != nil {
		var childCount int
		err := database.DB.QueryRow(`SELECT COUNT(*) FROM nav_table WHERE parent_id = ?`, *oldParentId).Scan(&childCount)
		if err == nil && childCount == 0 {
			database.DB.Exec(`DELETE FROM nav_table WHERE id = ? AND type = 'folder'`, *oldParentId)
			database.DB.Exec(`DELETE FROM dock_items WHERE tool_id = ?`, *oldParentId)
			logger.LogInfo("空文件夹自动删除(移出): folderId=%d", *oldParentId)
		}
	}

	c.JSON(200, gin.H{"success": true, "message": "移动成功"})
}

func UpdateFolderSettingsHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "无效 ID"})
		return
	}
	var body struct {
		FolderViewMode string `json:"folderViewMode"`
		FolderItemSize int    `json:"folderItemSize"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "无效请求"})
		return
	}
	if err := service.UpdateFolderSettings(id, body.FolderViewMode, body.FolderItemSize); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "文件夹设置更新成功"})
}

func DeleteFolderHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "无效 ID"})
		return
	}
	mode := c.DefaultQuery("mode", "move-children-to-root")
	if mode != "move-children-to-root" && mode != "delete-with-children" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "无效的删除模式"})
		return
	}
	if err := service.DeleteFolder(id, mode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "删除文件夹成功"})
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
		"message": "更新用户成功",
	})
}
