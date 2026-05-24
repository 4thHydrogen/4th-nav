package server

import (
	"embed"
	"net/http"
	"time"

	"github.com/4thHydrogen/4th-nav/handler"
	"github.com/4thHydrogen/4th-nav/middleware"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

func NewRouter(staticFS embed.FS) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	router.Use(gzip.Gzip(gzip.DefaultCompression, gzip.WithExcludedExtensions([]string{".png", ".jpg", ".jpeg", ".ico", ".svg"})))

	RegisterStaticRoutes(router, staticFS)
	RegisterPublicRoutes(router.Group("/api"))
	RegisterAdminRoutes(router.Group("/api/admin"))

	return router
}

func RegisterStaticRoutes(router *gin.Engine, staticFS embed.FS) {
	router.GET("/manifest.json", handler.ManifastHanlder)
	router.Use(serve("/", newBinaryFileSystem(staticFS, "public")))
}

func RegisterPublicRoutes(api *gin.RouterGroup) {
	api.GET("/", handler.GetAllHandler)
	api.POST("/login", handler.LoginHandler)
	api.GET("/logout", handler.LogoutHandler)
	api.GET("/img", handler.GetLogoImgHandler)
	api.GET("/searchEngines", handler.GetEnabledSearchEnginesHandler)
	api.GET("/background/current", handler.GetCurrentBackgroundHandler)
	api.GET("/background/cache/:filename", handler.ServeBackgroundCacheHandler)
}

func RegisterAdminRoutes(admin *gin.RouterGroup) {
	admin.Use(middleware.JWTMiddleware())

	admin.POST("/apiToken", handler.AddApiTokenHandler)
	admin.DELETE("/apiToken/:id", handler.DeleteApiTokenHandler)
	admin.GET("/all", handler.GetAdminAllDataHandler)
	admin.GET("/exportTools", handler.ExportToolsHandler)
	admin.POST("/importTools", handler.ImportToolsHandler)
	admin.PUT("/user", handler.UpdateUserHandler)
	admin.PUT("/setting", handler.UpdateSettingHandler)
	admin.PUT("/siteConfig", handler.UpdateSiteConfigHandler)

	// Tool routes
	admin.POST("/tool", handler.AddToolHandler)
	admin.DELETE("/tool/:id", handler.DeleteToolHandler)
	admin.PUT("/tool/:id", handler.UpdateToolHandler)
	admin.PUT("/tool/:id/viewMode", handler.UpdateToolViewModeHandler)
	admin.PUT("/tool/:id/parent", handler.MoveToolToFolderHandler)
	admin.PUT("/tool/:id/folderSettings", handler.UpdateFolderSettingsHandler)
	admin.DELETE("/folder/:id", handler.DeleteFolderHandler)
	admin.PUT("/layout", handler.UpdateLayoutHandler)
	admin.PUT("/tools/sort", handler.UpdateToolsSortHandler)

	// Icon management
	admin.POST("/tool/:id/icon/refresh", handler.IconRefreshHandler)
	admin.POST("/icons/refresh-missing", handler.IconsRefreshMissingHandler)
	admin.POST("/icons/refresh-all", handler.IconsRefreshAllHandler)
	admin.DELETE("/icons/cache", handler.IconsClearCacheHandler)
	admin.GET("/icons/status", handler.IconsStatusHandler)

	// Category routes
	admin.POST("/category", handler.AddCategoryHandler)
	admin.DELETE("/category/:id", handler.DeleteCategoryHandler)
	admin.PUT("/category/:id", handler.UpdateCategoryHandler)

	// Search engine routes
	admin.GET("/searchEngine", handler.GetAllSearchEnginesHandler)
	admin.POST("/searchEngine", handler.AddSearchEngineHandler)
	admin.PUT("/searchEngine/:id", handler.UpdateSearchEngineHandler)
	admin.DELETE("/searchEngine/:id", handler.DeleteSearchEngineHandler)
	admin.PUT("/searchEngines/sort", handler.UpdateSearchEngineSortHandler)

	// Background cache routes
	admin.POST("/background/refresh", handler.RefreshBackgroundHandler)
	admin.POST("/background/cache/clear", handler.ClearBackgroundCacheHandler)
	admin.POST("/background/test-key", handler.TestPexelsKeyHandler)

	// Dock routes
	admin.GET("/dock", handler.GetDockItemsHandler)
	admin.POST("/dock", handler.AddDockItemHandler)
	admin.DELETE("/dock/:id", handler.RemoveDockItemHandler)
	admin.PUT("/dock/sort", handler.UpdateDockSortHandler)
}

func NewHTTPServer(addr, port string, handler http.Handler) *http.Server {
	return &http.Server{
		Addr:         addr + ":" + port,
		Handler:      handler,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}
}
