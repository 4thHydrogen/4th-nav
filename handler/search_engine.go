package handler

import (
	"net/http"
	"strconv"

	"github.com/4thHydrogen/4th-nav/service"
	"github.com/4thHydrogen/4th-nav/types"

	"github.com/gin-gonic/gin"
)

func GetAllSearchEnginesHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    service.GetAllSearchEngines(),
	})
}

func AddSearchEngineHandler(c *gin.Context) {
	var engine types.SearchEngine
	if err := c.ShouldBindJSON(&engine); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	id, err := service.AddSearchEngine(engine)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "添加搜索引擎成功",
		"data": gin.H{
			"id": id,
		},
	})
}

func UpdateSearchEngineHandler(c *gin.Context) {
	var engine types.SearchEngine
	if err := c.ShouldBindJSON(&engine); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的 ID",
		})
		return
	}
	engine.Id = id

	if err := service.UpdateSearchEngine(engine); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "更新搜索引擎成功",
	})
}

func DeleteSearchEngineHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的 ID",
		})
		return
	}

	if err := service.DeleteSearchEngine(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "删除搜索引擎成功",
	})
}

func UpdateSearchEngineSortHandler(c *gin.Context) {
	var sortData []types.UpdateSearchEngineSortItem
	if err := c.ShouldBindJSON(&sortData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	if err := service.UpdateSearchEngineSort(sortData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "更新排序成功",
	})
}
