package handler

import (
	"net/http"
	"strconv"

	"github.com/4thHydrogen/4th-nav/service"
	"github.com/4thHydrogen/4th-nav/types"

	"github.com/gin-gonic/gin"
)

func GetDockItemsHandler(c *gin.Context) {
	items, err := service.GetDockItems()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "data": items})
}

func AddDockItemHandler(c *gin.Context) {
	var data types.AddDockItemDto
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	if err := service.AddDockItem(data.ToolID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "添加到 Dock 成功"})
}

func RemoveDockItemHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "无效 ID"})
		return
	}
	if err := service.RemoveDockItem(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "从 Dock 移除成功"})
}

func UpdateDockSortHandler(c *gin.Context) {
	var updates []types.UpdateDockSortDto
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	if err := service.UpdateDockSort(updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "errorMessage": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "Dock 排序更新成功"})
}
