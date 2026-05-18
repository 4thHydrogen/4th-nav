import { describe, it, expect } from 'vitest';
import type { Tool, Catelog, Setting, SiteConfig, SearchEngine, CardProps, ContentData, AdminApiData } from '../types';

describe('TypeScript types', () => {
  it('Tool interface matches backend shape', () => {
    const tool: Tool = {
      id: 1,
      name: 'Test',
      url: 'https://example.com',
      logo: 'test.ico',
      catelog: '工具',
      desc: 'A test tool',
      sort: 0,
      hide: false,
      viewMode: "icon",
      type: "icon",
      parentId: null,
      size: "1x1",
      bgColor: "",
      gridX: -1,
      gridY: -1,
    };
    expect(tool.id).toBe(1);
    expect(tool.catelog).toBe('工具');
  });

  it('Catelog interface has required fields', () => {
    const catelog: Catelog = {
      id: 1,
      name: '开发工具',
      sort: 1,
      hide: false,
    };
    expect(catelog.name).toBe('开发工具');
  });

  it('Setting interface has background fields', () => {
    const setting: Setting = {
      id: 1,
      favicon: '',
      title: 'Nav',
      govRecord: '',
      logo192: '',
      logo512: '',
      hideAdmin: false,
      hideGithub: false,
      hideToggleJumpTarget: false,
      jumpTargetBlank: true,
      backgroundUrl: 'bing',
      enableBackground: true,
      enableGlassmorphism: false,
      pexelsApiKey: "",
    };
    expect(setting.enableBackground).toBe(true);
    expect(setting.backgroundUrl).toBe('bing');
  });

  it('SiteConfig interface has columnsPerRow', () => {
    const config: SiteConfig = {
      id: 1,
      noImageMode: false,
      compactMode: false,
      columnsPerRow: 4,
    };
    expect(config.columnsPerRow).toBe(4);
  });

  it('ContentData has string[] catelogs (transformed shape)', () => {
    const data: ContentData = {
      tools: [],
      catelogs: ['全部工具', '开发工具', '设计工具'],
      setting: {} as Setting,
      siteConfig: {} as SiteConfig,
      dockItems: [],
    };
    expect(data.catelogs).toContain('全部工具');
    expect(data.catelogs[0]).toBe('全部工具');
  });

  it('CardProps has all required fields', () => {
    const props: CardProps = {
      title: 'Test',
      url: 'https://example.com',
      des: 'desc',
      logo: 'test.ico',
      catelog: '工具',
      index: 0,
      isSearching: false,
      noImageMode: false,
      compactMode: false,
      onClick: () => {},
    };
    expect(props.title).toBe('Test');
    expect(typeof props.onClick).toBe('function');
  });

  it('AdminApiData includes user and tokens', () => {
    const adminData: AdminApiData = {
      tools: [],
      catelogs: [],
      setting: {} as Setting,
      siteConfig: {} as SiteConfig,
      user: { name: 'admin', id: 1 },
      tokens: [],
    };
    expect(adminData.user.name).toBe('admin');
    expect(adminData.tokens).toHaveLength(0);
  });
});
