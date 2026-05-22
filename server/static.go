package server

import (
	"embed"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/4thHydrogen/4th-nav/logger"
	"github.com/gin-gonic/gin"
)

const indexFile = "index.html"

type binaryFileSystem struct {
	fs   http.FileSystem
	root string
}

func (b *binaryFileSystem) Open(name string) (http.File, error) {
	openPath := path.Join(b.root, name)
	return b.fs.Open(openPath)
}

func (b *binaryFileSystem) Exists(prefix string, filepath string) bool {
	if p := strings.TrimPrefix(filepath, prefix); len(p) < len(filepath) {
		var name string
		if p == "" {
			name = path.Join(b.root, p, indexFile)
		} else {
			name = path.Join(b.root, p)
		}
		if _, err := b.fs.Open(name); err != nil {
			return false
		}
		return true
	}
	return false
}

func newBinaryFileSystem(data embed.FS, root string) *binaryFileSystem {
	fs := http.FS(data)
	return &binaryFileSystem{fs, root}
}

type serveFileSystem interface {
	http.FileSystem
	Exists(prefix string, path string) bool
}

func serve(urlPrefix string, fs serveFileSystem) gin.HandlerFunc {
	fileserver := http.FileServer(fs)
	if urlPrefix != "" {
		fileserver = http.StripPrefix(urlPrefix, fileserver)
	}
	return func(c *gin.Context) {
		if fs.Exists(urlPrefix, c.Request.URL.Path) {
			fileserver.ServeHTTP(c.Writer, c.Request)
			c.Abort()
		} else {
			p := c.Request.URL.Path
			pathHasAPI := strings.Contains(p, "/api") && !strings.Contains(p, "/api-token")
			if pathHasAPI {
				return
			} else {
				file, err := fs.Open("index.html")
				if err != nil {
					logger.LogError("文件不存在: %s", c.Request.URL.Path)
					return
				}
				defer file.Close()
				http.ServeContent(c.Writer, c.Request, "index.html", time.Now(), file)
				c.Abort()
			}
		}
	}
}
