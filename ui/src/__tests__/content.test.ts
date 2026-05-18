import { describe, it, expect } from 'vitest';
import type { Tool } from '../types';

describe('Content filtering and grouping logic', () => {
  const mockTools: Tool[] = [
    { id: 1, name: 'GitHub', url: 'https://github.com', logo: '', catelog: '开发', desc: '', sort: 0, hide: false, viewMode: 'icon', type: 'icon', parentId: null, size: '1x1', bgColor: '', gridX: -1, gridY: -1, folderViewMode: 'grid', folderItemSize: 28 },
    { id: 2, name: 'Figma', url: 'https://figma.com', logo: '', catelog: '设计', desc: '', sort: 1, hide: false, viewMode: 'icon', type: 'icon', parentId: null, size: '1x1', bgColor: '', gridX: -1, gridY: -1, folderViewMode: 'grid', folderItemSize: 28 },
    { id: 3, name: 'VSCode', url: 'https://code.visualstudio.com', logo: '', catelog: '开发', desc: '', sort: 2, hide: false, viewMode: 'icon', type: 'icon', parentId: null, size: '1x1', bgColor: '', gridX: -1, gridY: -1, folderViewMode: 'grid', folderItemSize: 28 },
    { id: 4, name: 'Hidden Tool', url: 'https://hidden.com', logo: '', catelog: '测试', desc: '', sort: 3, hide: true, viewMode: 'icon', type: 'icon', parentId: null, size: '1x1', bgColor: '', gridX: -1, gridY: -1, folderViewMode: 'grid', folderItemSize: 28 },
  ];

  it('filters tools by category', () => {
    const filtered = mockTools.filter(t => t.catelog === '开发' && !t.hide);
    expect(filtered).toHaveLength(2);
    expect(filtered.every(t => t.catelog === '开发')).toBe(true);
  });

  it('filters out hidden tools', () => {
    const visible = mockTools.filter(t => !t.hide);
    expect(visible).toHaveLength(3);
  });

  it('groups tools by category', () => {
    const visible = mockTools.filter(t => !t.hide);
    const groups: Record<string, Tool[]> = {};
    visible.forEach(item => {
      const cat = item.catelog || '未分类';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    expect(Object.keys(groups)).toEqual(['开发', '设计']);
    expect(groups['开发']).toHaveLength(2);
    expect(groups['设计']).toHaveLength(1);
  });

  it('sorts groups by category order', () => {
    const categoryOrder = ['设计', '开发', '其他'];
    const visible = mockTools.filter(t => !t.hide);
    const groups: Record<string, Tool[]> = {};
    visible.forEach(item => {
      const cat = item.catelog || '未分类';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    const ordered: Record<string, Tool[]> = {};
    categoryOrder.forEach(cat => {
      if (groups[cat]) ordered[cat] = groups[cat];
    });
    Object.keys(groups).forEach(cat => {
      if (!ordered[cat]) ordered[cat] = groups[cat];
    });
    expect(Object.keys(ordered)).toEqual(['设计', '开发']);
  });

  it('search matches name, desc, and url', () => {
    const search = (item: Tool, query: string) => {
      const q = query.toLowerCase();
      return item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q);
    };
    expect(search(mockTools[0], 'github')).toBe(true);
    expect(search(mockTools[0], 'figma')).toBe(false);
    expect(search(mockTools[2], 'code')).toBe(true);
  });
});
