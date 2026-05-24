package main

import (
	"embed"
	"flag"
	"fmt"
	iofs "io/fs"
	"net/http"

	"github.com/4thHydrogen/4th-nav/database"
	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/4thHydrogen/4th-nav/server"
	"github.com/4thHydrogen/4th-nav/service"
)

//go:embed public
var fs embed.FS

var port = flag.String("port", "6412", "指定监听端口")
var addr = flag.String("addr", "0.0.0.0", "指定监听地址")

func main() {
	flag.Parse()
	database.InitDB()

	publicFS, _ := iofs.Sub(fs, "public")
	service.InitStaticFS(publicFS)

	router := server.NewRouter(fs)

	logger.LogInfo("应用启动成功，地址: http://localhost:%s", *port)
	srv := server.NewHTTPServer(*addr, *port, router)

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.LogError("应用启动失败，错误: %s", err)
	}

	fmt.Println("应用已停止")
}
