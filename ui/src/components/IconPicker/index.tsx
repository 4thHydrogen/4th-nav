import { Modal, Tabs, Input } from "antd";
import { getLogoUrl, isInlineSvg } from "../../utils/check";
import { sanitizeSvg } from "../../utils/sanitize";
import { useMemo, useState, useEffect, useCallback } from "react";
import "./index.css";

interface IconPickerProps {
  open: boolean;
  existingLogos: string[];
  onSelect: (logo: string) => void;
  onCancel: () => void;
}

const BUILTIN_ICONS: { name: string; svg: string }[] = [
  { name: "首页", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { name: "搜索", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' },
  { name: "邮件", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' },
  { name: "日历", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
  { name: "设置", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
  { name: "用户", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
  { name: "链接", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' },
  { name: "文档", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
  { name: "代码", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
  { name: "数据库", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
  { name: "下载", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' },
  { name: "上传", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' },
  { name: "锁", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
  { name: "星标", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
  { name: "聊天", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
  { name: "视频", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' },
  { name: "音乐", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' },
  { name: "图片", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
  { name: "地图", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>' },
  { name: "购物", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' },
  { name: "终端", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>' },
  { name: "书本", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { name: "通知", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
  { name: "云", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>' },
  { name: "钱包", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
];

interface StaticIcon {
  file: string;
  name: string;
}

interface StaticIconsData {
  [group: string]: StaticIcon[];
}

const GROUP_LABELS: Record<string, string> = {
  brand: "品牌",
  category: "分类",
  engine: "搜索引擎",
};

const FOLDER_GROUPS = ["brand", "category", "engine"];
const PREVIEW_COUNT = 4;

function IconCell({ logo, onClick, title, small }: {
  logo: string;
  onClick: () => void;
  title?: string;
  small?: boolean;
}) {
  const cls = small ? "icon-folder-icon icon-folder-icon-sm" : "icon-folder-icon";
  if (isInlineSvg(logo)) {
    return (
      <div className={cls} onClick={onClick} title={title || "SVG"}>
        <span
          className="icon-folder-icon-svg"
          dangerouslySetInnerHTML={{ __html: sanitizeSvg(logo) }}
        />
      </div>
    );
  }
  return (
    <div className={cls} onClick={onClick} title={title}>
      <img src={getLogoUrl(logo)} alt={title || ""} />
    </div>
  );
}

function IconFolder({ group, label, icons, baseUrl, keyword, expanded, onToggle, onSelect }: {
  group: string;
  label: string;
  icons: StaticIcon[];
  baseUrl: string;
  keyword: string;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (path: string) => void;
}) {
  const filtered = useMemo(() => {
    if (!keyword.trim()) return icons;
    const k = keyword.toLowerCase();
    return icons.filter(i => i.name.toLowerCase().includes(k) || i.file.toLowerCase().includes(k));
  }, [icons, keyword]);

  if (keyword.trim() && filtered.length === 0) return null;

  const previewIcons = expanded ? filtered : filtered.slice(0, PREVIEW_COUNT);
  const overflow = expanded ? 0 : Math.max(0, filtered.length - PREVIEW_COUNT);

  return (
    <div className={`icon-folder${expanded ? " icon-folder-expanded" : ""}`}>
      <div className="icon-folder-header" onClick={onToggle}>
        <span className="icon-folder-title">{label}</span>
        <span className="icon-folder-meta">
          {filtered.length > 0 && <span className="icon-folder-count">{filtered.length}</span>}
          <span className="icon-folder-toggle">{expanded ? "收起" : "展开"}</span>
        </span>
      </div>
      {filtered.length > 0 ? (
        <div className="icon-folder-grid">
          {previewIcons.map((icon) => (
            <IconCell
              key={icon.file}
              logo={`${baseUrl}/${icon.file}`}
              onClick={() => onSelect(`${baseUrl}/${icon.file}`)}
              title={icon.name}
            />
          ))}
          {overflow > 0 && (
            <div className="icon-folder-overflow">+{overflow}</div>
          )}
        </div>
      ) : (
        <div className="icon-folder-empty">暂无图标</div>
      )}
    </div>
  );
}

interface SearchResult {
  key: string;
  logo: string;
  title: string;
  source: string;
}

export default function IconPicker({ open, existingLogos, onSelect, onCancel }: IconPickerProps) {
  const uniqueLogos = [...new Set(existingLogos.filter(Boolean))];
  const [staticIcons, setStaticIcons] = useState<StaticIconsData | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [tabKeyword, setTabKeyword] = useState("");
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setGlobalSearch(""); setTabKeyword(""); setExpandedFolder(null); return; }
    fetch("/static/icons/icons.json")
      .then(res => res.json())
      .then((data: StaticIconsData) => setStaticIcons(data))
      .catch(() => setStaticIcons(null));
  }, [open]);

  const handleToggle = useCallback((group: string) => {
    setExpandedFolder(prev => prev === group ? null : group);
  }, []);

  const isSearching = tabKeyword.trim().length > 0;

  // Global search across all icon sources
  const searchResults = useMemo<SearchResult[]>(() => {
    const query = globalSearch.trim().toLowerCase();
    if (!query) return [];

    const results: SearchResult[] = [];

    // Search built-in SVG icons
    BUILTIN_ICONS.forEach((icon) => {
      if (icon.name.toLowerCase().includes(query)) {
        results.push({
          key: `builtin-${icon.name}`,
          logo: icon.svg,
          title: icon.name,
          source: "基础图标",
        });
      }
    });

    // Search static icons from all groups
    if (staticIcons) {
      [...FOLDER_GROUPS, "ungrouped"].forEach((group) => {
        const icons = staticIcons[group] || [];
        const groupLabel = GROUP_LABELS[group] || group;
        icons.forEach((icon) => {
          if (
            icon.name.toLowerCase().includes(query) ||
            icon.file.toLowerCase().includes(query) ||
            groupLabel.toLowerCase().includes(query)
          ) {
            const path = group === "ungrouped"
              ? `/static/icons/ungrouped/${icon.file}`
              : `/static/icons/${group}/${icon.file}`;
            results.push({
              key: `static-${group}-${icon.file}`,
              logo: path,
              title: icon.name,
              source: groupLabel,
            });
          }
        });
      });
    }

    // Search existing logos
    uniqueLogos.forEach((logo, index) => {
      const fileName = logo.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
      if (
        fileName.toLowerCase().includes(query) ||
        logo.toLowerCase().includes(query)
      ) {
        results.push({
          key: `existing-${index}`,
          logo,
          title: fileName || logo,
          source: "已有图标",
        });
      }
    });

    return results;
  }, [globalSearch, staticIcons, uniqueLogos]);

  const hasGlobalSearch = globalSearch.trim().length > 0;

  const tabs = [
    {
      key: "static",
      label: "图标库",
      children: staticIcons ? (
        <div className="icon-picker-static">
          <Input.Search
            placeholder="搜索图标名称..."
            allowClear
            value={tabKeyword}
            onChange={(e) => setTabKeyword(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <div className="icon-picker-folders">
            {FOLDER_GROUPS.map((group) => {
              const icons = staticIcons[group] || [];
              if (isSearching && !icons.some(i =>
                i.name.toLowerCase().includes(tabKeyword.toLowerCase()) ||
                i.file.toLowerCase().includes(tabKeyword.toLowerCase())
              )) return null;
              return (
                <IconFolder
                  key={group}
                  group={group}
                  label={GROUP_LABELS[group] || group}
                  icons={icons}
                  baseUrl={`/static/icons/${group}`}
                  keyword={tabKeyword}
                  expanded={isSearching || expandedFolder === group}
                  onToggle={() => handleToggle(group)}
                  onSelect={onSelect}
                />
              );
            })}
            {(staticIcons.ungrouped || []).length > 0 && (
              (() => {
                const ungrouped = staticIcons.ungrouped;
                const filtered = isSearching
                  ? ungrouped.filter(i => i.name.toLowerCase().includes(tabKeyword.toLowerCase()) || i.file.toLowerCase().includes(tabKeyword.toLowerCase()))
                  : ungrouped;
                if (filtered.length === 0) return null;
                return filtered.map((icon) => (
                  <IconCell
                    key={icon.file}
                    logo={`/static/icons/ungrouped/${icon.file}`}
                    onClick={() => onSelect(`/static/icons/ungrouped/${icon.file}`)}
                    title={icon.name}
                    small
                  />
                ));
              })()
            )}
          </div>
        </div>
      ) : (
        <div className="icon-picker-empty">加载图标中...</div>
      ),
    },
    {
      key: "existing",
      label: "已有图标",
      children: uniqueLogos.length > 0 ? (
        <div className="icon-picker-grid">
          {uniqueLogos.map((logo, i) => (
            <IconCell key={i} logo={logo} onClick={() => onSelect(logo)} />
          ))}
        </div>
      ) : (
        <div className="icon-picker-empty">暂无已有图标</div>
      ),
    },
    {
      key: "builtin",
      label: "基础图标",
      children: (
        <div className="icon-picker-grid">
          {BUILTIN_ICONS.map((icon) => (
            <IconCell
              key={icon.name}
              logo={icon.svg}
              onClick={() => onSelect(icon.svg)}
              title={icon.name}
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title="选择图标"
      onCancel={onCancel}
      footer={null}
      width={640}
      destroyOnClose
    >
      <Input.Search
        placeholder="搜索所有图标..."
        allowClear
        value={globalSearch}
        onChange={(e) => setGlobalSearch(e.target.value)}
        className="icon-picker-global-search"
      />
      {hasGlobalSearch ? (
        searchResults.length > 0 ? (
          <div className="icon-picker-search-results">
            {searchResults.map((result) => (
              <div key={result.key} className="icon-picker-search-item">
                <IconCell
                  logo={result.logo}
                  onClick={() => onSelect(result.logo)}
                  title={result.title}
                />
                <span className="icon-picker-search-item-label">{result.title}</span>
                <span className="icon-picker-search-item-source">{result.source}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="icon-picker-empty">未找到匹配的图标</div>
        )
      ) : (
        <Tabs items={tabs} />
      )}
    </Modal>
  );
}
