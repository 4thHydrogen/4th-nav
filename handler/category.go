package handler

import (
	"net/http"

	"github.com/4thHydrogen/4th-nav/database"
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
		"message": "增加分类成功",
	})
}

func DeleteCategoryHandler(c *gin.Context) {
	id := c.Param("id")
	sql_delete_catelog := `DELETE FROM nav_catelog WHERE id = ?;`
	stmt, err := database.DB.Prepare(sql_delete_catelog)
	utils.CheckErr(err)
	res, err := stmt.Exec(id)
	utils.CheckErr(err)
	_, err = res.RowsAffected()
	utils.CheckErr(err)
	c.JSON(200, gin.H{
		"success": true,
		"message": "删除分类成功",
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
		"message": "更新分类成功",
	})
}
