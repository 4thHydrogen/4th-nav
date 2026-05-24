package types

// 默认是 0
type Setting struct {
	Id                   int    `json:"id"`
	Favicon              string `json:"favicon"`
	Title                string `json:"title"`
	GovRecord            string `json:"govRecord"`
	Logo192              string `json:"logo192"`
	Logo512              string `json:"logo512"`
	HideAdmin            bool   `json:"hideAdmin"`
	HideGithub           bool   `json:"hideGithub"`
	HideToggleJumpTarget bool   `json:"hideToggleJumpTarget"`
	JumpTargetBlank      bool   `json:"jumpTargetBlank"`
	BackgroundUrl        string `json:"backgroundUrl"`
	EnableBackground     bool   `json:"enableBackground"`
	EnableSurfaceEffects bool   `json:"enableSurfaceEffects"`
	PexelsApiKey         string `json:"pexelsApiKey"`
	Proxy                string `json:"proxy"`
	IconProviderMode     string `json:"iconProviderMode"`
	BrandfetchClientID   string `json:"brandfetchClientId"`
	EnableBrandfetch     bool   `json:"enableBrandfetch"`
	EnableIconHorse      bool   `json:"enableIconHorse"`
}

type Token struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	Value    string `json:"value"`
	Disabled int    `json:"disabled"`
}

type User struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	Password string `json:"password"`
}
type Img struct {
	Id    int    `json:"id"`
	Url   string `json:"url"`
	Value string `json:"value"`
}

type Tool struct {
	Id             int    `json:"id"`
	Name           string `json:"name"`
	Url            string `json:"url"`
	Logo           string `json:"logo"`
	Category       string `json:"category"`
	Description    string `json:"description"`
	Sort           int    `json:"sort"`
	Hide           bool   `json:"hide"`
	ViewMode       string `json:"viewMode"`
	Type           string `json:"type"`
	ParentId       *int   `json:"parentId"`
	Size           string `json:"size"`
	FolderTint     string `json:"folderTint"`
	GridX          int    `json:"gridX"`
	GridY          int    `json:"gridY"`
	FolderViewMode string `json:"folderViewMode"`
	FolderItemSize int    `json:"folderItemSize"`
	IconStatus     string `json:"iconStatus"`
	IconError      string `json:"iconError"`
	IconUpdatedAt  int64  `json:"iconUpdatedAt"`
	IconSource     string `json:"iconSource"`
}

type Category struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
	Sort int    `json:"sort"`
	Hide bool   `json:"hide"`
}

// 搜索引擎模型
type SearchEngine struct {
	Id          int    `json:"id"`
	Name        string `json:"name"`
	BaseUrl     string `json:"baseUrl"`
	QueryParam  string `json:"queryParam"`
	Logo        string `json:"logo"`
	Sort        int    `json:"sort"`
	Enabled     bool   `json:"enabled"`
}

// 网站配置模型
type SiteConfig struct {
	Id                 int    `json:"id"`
	NoImageMode        bool   `json:"noImageMode"`
	CompactMode        bool   `json:"compactMode"`
	ColumnsPerRow      int    `json:"columnsPerRow"`
	IconSize           int    `json:"iconSize"`
	Density            string `json:"density"`
	FolderListItemSize int    `json:"folderListItemSize"`
}
