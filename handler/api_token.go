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
	err := c.ShouldBindJSON(&token)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	newID := utils.GenerateId()
	signedJWT, err := utils.SignJWTForAPI(token.Name, newID)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	service.AddApiTokenInDB(types.Token{
		Name:     token.Name,
		Value:    signedJWT,
		Id:       newID,
		Disabled: 0,
	})
	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"id":    newID,
			"Value": signedJWT,
			"Name":  token.Name,
		},
		"message": "娣诲姞 Token 鎴愬姛",
	})
}

func DeleteApiTokenHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "鏃犳晥 ID",
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
		"message": "鍒犻櫎 API Token 鎴愬姛",
	})
}
