package handler

import (
	"net/http"
	"strconv"

	"github.com/4thHydrogen/4th-nav/service"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/4thHydrogen/4th-nav/utils"

	"github.com/gin-gonic/gin"
)

func AddApiTokenHandler(c *gin.Context) {
	var token types.AddTokenDto
	if err := c.ShouldBindJSON(&token); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	newID := utils.GenerateId()
	signedJWT, err := utils.SignJWTForAPI(token.Name, newID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	if err := service.AddApiTokenInDB(types.Token{
		Name:     token.Name,
		Value:    signedJWT,
		Id:       newID,
		Disabled: 0,
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"id":    newID,
			"Value": signedJWT,
			"Name":  token.Name,
		},
		"message": "新增 API Token 成功",
	})
}

func DeleteApiTokenHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的 Token ID",
		})
		return
	}

	if err := service.DisableApiToken(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "删除 API Token 成功",
	})
}
