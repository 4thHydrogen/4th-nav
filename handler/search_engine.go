package handler

import (
	"net/http"
	"strconv"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/types"

	"github.com/gin-gonic/gin"
)

func GetAllSearchEnginesHandler(c *gin.Context) {
	engines, err := database.GetAllSearchEngines()
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

func AddSearchEngineHandler(c *gin.Context) {
	var engine types.SearchEngine
	err := c.ShouldBindJSON(&engine)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	id, err := database.AddSearchEngine(engine)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "添加搜索引擎成功",
		"data": gin.H{
			"id": id,
		},
	})
}

func UpdateSearchEngineHandler(c *gin.Context) {
	var engine types.SearchEngine
	err := c.ShouldBindJSON(&engine)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的ID",
		})
		return
	}
	engine.Id = id

	err = database.UpdateSearchEngine(engine)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "更新搜索引擎成功",
	})
}

func DeleteSearchEngineHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的ID",
		})
		return
	}

	err = database.DeleteSearchEngine(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "删除搜索引擎成功",
	})
}

func UpdateSearchEngineSortHandler(c *gin.Context) {
	var sortData []struct {
		Id   int `json:"id"`
		Sort int `json:"sort"`
	}
	err := c.ShouldBindJSON(&sortData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	err = database.UpdateSearchEngineSort(sortData)
	if err != nil {
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
