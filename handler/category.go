package handler

import (
	"net/http"
	"strconv"

	"github.com/4thHydrogen/4th-nav/service"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/4thHydrogen/4th-nav/utils"

	"github.com/gin-gonic/gin"
)

func AddCategoryHandler(c *gin.Context) {
	var data types.AddCategoryDto
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	service.AddCategory(data)
	c.JSON(200, gin.H{
		"success": true,
		"message": "澧炲姞鍒嗙被鎴愬姛",
	})
}

func DeleteCategoryHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "鏃犳晥 ID",
		})
		return
	}
	if err := service.DeleteCategory(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"success": true,
		"message": "鍒犻櫎鍒嗙被鎴愬姛",
	})
}

func UpdateCategoryHandler(c *gin.Context) {
	var data types.UpdateCategoryDto
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	service.UpdateCategory(data)
	c.JSON(200, gin.H{
		"success": true,
		"message": "鏇存柊鍒嗙被鎴愬姛",
	})
}
