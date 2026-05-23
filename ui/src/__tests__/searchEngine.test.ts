import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../shared/api/search-engine', () => ({
  fetchGetEnabledSearchEngines: vi.fn(),
}));

import { fetchGetEnabledSearchEngines } from '../shared/api/search-engine';
import { getEnabledSearchEngines, generateSearchUrl, clearSearchEngineCache } from '../utils/searchEngine';

const mockEngines = [
  { id: 1, name: '百度', baseUrl: 'https://www.baidu.com/s', queryParam: 'wd', logo: 'baidu.ico', sort: 1, enabled: true },
  { id: 2, name: 'Bing', baseUrl: 'https://cn.bing.com/search', queryParam: 'q', logo: 'bing.ico', sort: 2, enabled: true },
  { id: 3, name: 'Google', baseUrl: 'https://www.google.com/search', queryParam: 'q', logo: 'google.ico', sort: 3, enabled: false },
];

describe('searchEngine utilities', () => {
  beforeEach(() => {
    clearSearchEngineCache();
    vi.clearAllMocks();
  });

  describe('getEnabledSearchEngines', () => {
    it('returns engines from API', async () => {
      vi.mocked(fetchGetEnabledSearchEngines).mockResolvedValue(mockEngines);
      const result = await getEnabledSearchEngines();
      expect(result).toHaveLength(3);
    });

    it('returns fallback engines on API error', async () => {
      vi.mocked(fetchGetEnabledSearchEngines).mockRejectedValue(new Error('Network error'));
      const result = await getEnabledSearchEngines();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toContain('百度');
    });
  });

  describe('generateSearchUrl', () => {
    it('generates URL with query param', () => {
      const url = generateSearchUrl('https://www.baidu.com/s', 'wd', 'hello');
      expect(url).toBe('https://www.baidu.com/s?wd=hello');
    });

    it('encodes special characters', () => {
      const url = generateSearchUrl('https://www.baidu.com/s', 'wd', 'hello world');
      expect(url).toContain('wd=hello%20world');
    });

    it('uses & separator when base URL already has ?', () => {
      const url = generateSearchUrl('https://example.com/search?lang=zh', 'q', 'test');
      expect(url).toBe('https://example.com/search?lang=zh&q=test');
    });
  });
});
