import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/api', () => ({
  fetchGetEnabledSearchEngines: vi.fn(),
}));

import { fetchGetEnabledSearchEngines } from '../utils/api';
import { generateSearchEngineCard, clearSearchEngineCache } from '../utils/searchEngine';

const mockEngines = [
  { id: 1, name: '百度', baseUrl: 'https://www.baidu.com/s', queryParam: 'wd', logo: 'baidu.ico', sort: 1, enabled: true },
  { id: 2, name: 'Bing', baseUrl: 'https://cn.bing.com/search', queryParam: 'q', logo: 'bing.ico', sort: 2, enabled: true },
  { id: 3, name: 'Google', baseUrl: 'https://www.google.com/search', queryParam: 'q', logo: 'google.ico', sort: 3, enabled: false },
];

describe('serachEngine utilities', () => {
  beforeEach(() => {
    clearSearchEngineCache();
    vi.clearAllMocks();
  });

  describe('generateSearchEngineCard', () => {
    it('returns empty array for empty search string', async () => {
      const result = await generateSearchEngineCard('');
      expect(result).toHaveLength(0);
    });

    it('returns empty array for whitespace-only search string', async () => {
      const result = await generateSearchEngineCard('   ');
      expect(result).toHaveLength(0);
    });

    it('generates cards only for enabled engines', async () => {
      vi.mocked(fetchGetEnabledSearchEngines).mockResolvedValue(mockEngines);
      const result = await generateSearchEngineCard('test');
      expect(result).toHaveLength(2);
    });

    it('generates cards with correct Tool shape', async () => {
      vi.mocked(fetchGetEnabledSearchEngines).mockResolvedValue(mockEngines);
      const result = await generateSearchEngineCard('test');
      const card = result[0];
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('name');
      expect(card).toHaveProperty('url');
      expect(card).toHaveProperty('desc');
      expect(card).toHaveProperty('logo');
      expect(card).toHaveProperty('catelog');
      expect(card).toHaveProperty('sort');
      expect(card).toHaveProperty('hide');
      expect(card.catelog).toBe('');
      expect(card.sort).toBe(0);
      expect(card.hide).toBe(false);
    });

    it('generates correct search URL', async () => {
      vi.mocked(fetchGetEnabledSearchEngines).mockResolvedValue(mockEngines);
      const result = await generateSearchEngineCard('hello');
      expect(result[0].url).toContain('wd=');
      expect(result[0].url).toContain(encodeURIComponent('hello'));
    });

    it('returns fallback engines on API error', async () => {
      clearSearchEngineCache();
      vi.mocked(fetchGetEnabledSearchEngines).mockRejectedValue(new Error('Network error'));
      const result = await generateSearchEngineCard('test');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toContain('百度');
    });
  });
});
