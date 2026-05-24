package middleware

import (
	"net/http"
	"strings"

	"github.com/4thHydrogen/4th-nav/service"
	"github.com/4thHydrogen/4th-nav/utils"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
)

func extractToken(authHeader string) string {
	if strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer ")
	}
	return authHeader
}

func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		rawToken := extractToken(c.Request.Header.Get("Authorization"))
		if rawToken == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success":      false,
				"errorMessage": "未登录",
			})
			c.Abort()
			return
		}

		if service.HasApiToken(rawToken) {
			c.Set("username", "apiToken")
			c.Set("uid", 1)
			c.Next()
			return
		}

		token, err := utils.ParseJWT(rawToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success":      false,
				"errorMessage": "未登录",
			})
			c.Abort()
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			c.Set("username", claims["name"])
			c.Set("uid", claims["id"])
			c.Next()
			return
		}

		c.JSON(http.StatusUnauthorized, gin.H{
			"success":      false,
			"errorMessage": "未登录",
		})
		c.Abort()
	}
}
