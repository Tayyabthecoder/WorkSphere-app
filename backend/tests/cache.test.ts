import { getCached, setCached, invalidateCachePrefix, clearCache } from '../src/utils/reportCache.js';

describe('Report Cache Utility', () => {
  beforeEach(() => {
    clearCache();
  });

  it('should store and retrieve cached objects within TTL window', () => {
    const data = { kpis: { totalProjects: 10, totalTasks: 42 } };
    setCached('report:tenant1:month', data, 1000);

    const retrieved = getCached('report:tenant1:month');
    expect(retrieved).toEqual(data);
  });

  it('should return null for non-existent keys', () => {
    const result = getCached('non_existent_key');
    expect(result).toBeNull();
  });

  it('should return null after cache TTL has expired', async () => {
    const data = { kpis: { totalProjects: 5 } };
    setCached('report:tenant1:expiring', data, 50); // 50ms TTL

    expect(getCached('report:tenant1:expiring')).toEqual(data);

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(getCached('report:tenant1:expiring')).toBeNull();
  });

  it('should invalidate cache entries matching a given prefix', () => {
    setCached('report:tenantA:month', { data: 1 }, 5000);
    setCached('report:tenantA:quarter', { data: 2 }, 5000);
    setCached('report:tenantB:month', { data: 3 }, 5000);

    invalidateCachePrefix('report:tenantA');

    expect(getCached('report:tenantA:month')).toBeNull();
    expect(getCached('report:tenantA:quarter')).toBeNull();
    expect(getCached('report:tenantB:month')).not.toBeNull();
  });
});
