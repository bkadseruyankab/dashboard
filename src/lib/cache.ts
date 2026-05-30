// Simple in-memory cache that can be shared across route handlers
const dashboardCache = new Map<string, { data: unknown; timestamp: number }>();

export function getDashboardCache(key: string): unknown | null {
  const entry = dashboardCache.get(key);
  if (entry && Date.now() - entry.timestamp < 60_000) {
    return entry.data;
  }
  dashboardCache.delete(key);
  return null;
}

export function setDashboardCache(key: string, data: unknown): void {
  dashboardCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateDashboardCache(): void {
  dashboardCache.clear();
}
