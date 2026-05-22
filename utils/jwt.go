package utils

import (
	"crypto/rand"
	"encoding/hex"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/types"
)

func RandomJWTKey() string {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		logger.LogError("生成随机密钥失败: %v", err)
		return "fallback_secret_key_12345"
	}
	return hex.EncodeToString(bytes)
}

var jwtSecret []byte

func init() {
	if envSecret := os.Getenv("JWT_SECRET"); envSecret != "" {
		jwtSecret = []byte(envSecret)
		logger.LogInfo("JWT Secret loaded from environment variable")
	} else {
		jwtSecret = []byte(RandomJWTKey())
		logger.LogWarning("JWT_SECRET not set, using random key (tokens will invalidates on restart)")
	}
}

// 签名一个 JTW
func SignJWT(user types.User) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"name": user.Name,
		"id":   user.Id,
		"exp":  time.Now().Add(time.Hour * 24 * 30).Unix(),
	})
	tokenString, err := token.SignedString([]byte(jwtSecret))
	return tokenString, err
}

// 签名一个 JTW
func SignJWTForAPI(tokenName string, tokenId int) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"name": tokenName,
		"id":   tokenId,
		"exp":  time.Now().Add(time.Hour * 24 * 365 * 100).Unix(),
	})
	tokenString, err := token.SignedString([]byte(jwtSecret))
	return tokenString, err
}

// 解密一个 JTW
func ParseJWT(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (i interface{}, e error) {
		return jwtSecret, nil
	})
	return token, err
}

func IsLogin(c *gin.Context) bool {
	rawToken := c.Request.Header.Get("Authorization")
	if rawToken == "" {
		return false
	}
	tokenStr := rawToken
	if strings.HasPrefix(rawToken, "Bearer ") {
		tokenStr = strings.TrimPrefix(rawToken, "Bearer ")
	}
	token, err := ParseJWT(tokenStr)
	return err == nil && token.Valid
}
