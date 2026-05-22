package handler

import (
	"net/http"

	"github.com/4thHydrogen/4th-nav/service"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/4thHydrogen/4th-nav/utils"

	"github.com/gin-gonic/gin"
)

func LoginHandler(c *gin.Context) {
	var data types.LoginDto
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	user := service.GetUser(data.Name)
	if user.Name == "" {
		c.JSON(200, gin.H{
			"success":      false,
			"errorMessage": "用户名不存在",
		})
		return
	}
	if !utils.CheckPassword(user.Password, data.Password) {
		c.JSON(200, gin.H{
			"success":      false,
			"errorMessage": "密码错误",
		})
		return
	}
	if !utils.IsBcryptHash(user.Password) {
		hashed, err := utils.HashPassword(data.Password)
		if err == nil {
			service.UpdateUser(types.UpdateUserDto{
				Id:       int64(user.Id),
				Name:     user.Name,
				Password: hashed,
			})
		}
	}
	token, err := utils.SignJWT(user)
	utils.CheckErr(err)

	c.JSON(200, gin.H{
		"success": true,
		"message": "登录成功",
		"data": gin.H{
			"user":  user,
			"token": token,
		},
	})
}

func LogoutHandler(c *gin.Context) {
	c.JSON(200, gin.H{
		"success": true,
		"message": "登出成功",
	})
}
