package types

type ResUserDto struct {
	Name string `json:"name"`
}

type UpdateUserDto struct {
	Id       int64  `json:"id"`
	Name     string `json:"name"`
	Password string `json:"password"`
}

type LoginDto struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}
type AddTokenDto struct {
	Name string `json:"name"`
}

type UpdateCatelogDto struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
	Sort int    `json:"sort"`
	Hide bool   `json:"hide"`
}

type AddCatelogDto struct {
	Name string `json:"name"`
	Sort int    `json:"sort"`
	Hide bool   `json:"hide"`
}
type UpdateToolDto struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	Url      string `json:"url"`
	Logo     string `json:"logo"`
	Catelog  string `json:"catelog"`
	Desc     string `json:"desc"`
	Sort     int    `json:"sort"`
	Hide     bool   `json:"hide"`
	ViewMode string `json:"viewMode"`
	Type     string `json:"type"`
	ParentId *int   `json:"parentId"`
	Size     string `json:"size"`
	BgColor  string `json:"bgColor"`
	GridX          int    `json:"gridX"`
	GridY          int    `json:"gridY"`
	FolderViewMode string `json:"folderViewMode"`
	FolderItemSize int    `json:"folderItemSize"`
}
type AddToolDto struct {
	Name     string `json:"name"`
	Url      string `json:"url"`
	Logo     string `json:"logo"`
	Catelog  string `json:"catelog"`
	Desc     string `json:"desc"`
	Sort     int    `json:"sort"`
	Hide     bool   `json:"hide"`
	ViewMode string `json:"viewMode"`
	Type     string `json:"type"`
	ParentId *int   `json:"parentId"`
	Size     string `json:"size"`
	BgColor  string `json:"bgColor"`
	GridX          int    `json:"gridX"`
	GridY          int    `json:"gridY"`
	FolderViewMode string `json:"folderViewMode"`
	FolderItemSize int    `json:"folderItemSize"`
}
type UpdateToolsSortDto struct {
	Id   int `json:"id"`
	Sort int `json:"sort"`
}

type LayoutItemDto struct {
	Id    int `json:"id"`
	GridX int `json:"gridX"`
	GridY int `json:"gridY"`
	W     int `json:"w"`
	H     int `json:"h"`
}

type UpdateLayoutDto struct {
	Items []LayoutItemDto `json:"items"`
}

type AddDockItemDto struct {
	ToolID int `json:"toolId" binding:"required"`
}

type UpdateDockSortDto struct {
	ID   int `json:"id"`
	Sort int `json:"sort"`
}

type DockItem struct {
	ID      int    `json:"id"`
	Sort    int    `json:"sort"`
	ToolID  int    `json:"toolId"`
	Name    string `json:"name"`
	Url     string `json:"url"`
	Logo    string `json:"logo"`
	Catelog string `json:"catelog"`
	Desc    string `json:"desc"`
}
