/**
 * API 快取服務
 * 用於減少重複 API 請求，提升載入速度
 */

import type { MarketApiResponse, MarketHistoryRecord } from '../types/market';

// 快取項目介面
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // 存活時間（毫秒）
}

// 快取配置
export const CACHE_CONFIG = {
  // 市場數據快取時間：5 分鐘
  MARKET_DATA_TTL: 5 * 60 * 1000,
  // 歷史記錄快取時間：10 分鐘
  HISTORY_DATA_TTL: 10 * 60 * 1000,
  // 最大快取項目數
  MAX_CACHE_SIZE: 50,
} as const;

// 快取儲存
const marketCache = new Map<string, CacheItem<MarketApiResponse>>();
const historyCache = new Map<string, CacheItem<MarketHistoryRecord[]>>();

/**
 * 生成快取 key
 */
function generateCacheKey(prefix: string, ...parts: string[]): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * 檢查快取是否有效
 */
function isCacheValid<T>(item: CacheItem<T> | undefined): item is CacheItem<T> {
  if (!item) return false;
  return Date.now() - item.timestamp < item.ttl;
}

/**
 * 清理過期快取
 */
function cleanExpiredCache<T>(cache: Map<string, CacheItem<T>>): void {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now - item.timestamp >= item.ttl) {
      cache.delete(key);
    }
  }
}

/**
 * 限制快取大小（LRU 策略）
 */
function limitCacheSize<T>(cache: Map<string, CacheItem<T>>, maxSize: number): void {
  if (cache.size <= maxSize) return;
  
  // 按時間排序，刪除最舊的項目
  const entries = Array.from(cache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  const deleteCount = cache.size - maxSize;
  for (let i = 0; i < deleteCount; i++) {
    cache.delete(entries[i][0]);
  }
}

/**
 * 獲取市場數據快取
 */
export function getMarketCache(search: string): MarketApiResponse | null {
  const key = generateCacheKey('market', search.toLowerCase());
  const item = marketCache.get(key);
  
  if (isCacheValid(item)) {
    console.log(`[Cache] Hit for market: ${search}`);
    return item.data;
  }
  
  return null;
}

/**
 * 設置市場數據快取
 */
export function setMarketCache(search: string, data: MarketApiResponse): void {
  const key = generateCacheKey('market', search.toLowerCase());
  
  marketCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: CACHE_CONFIG.MARKET_DATA_TTL,
  });
  
  // 清理過期快取
  cleanExpiredCache(marketCache);
  // 限制快取大小
  limitCacheSize(marketCache, CACHE_CONFIG.MAX_CACHE_SIZE);
  
  console.log(`[Cache] Set for market: ${search}`);
}

/**
 * 獲取歷史記錄快取
 */
export function getHistoryCache(search: string, type: string): MarketHistoryRecord[] | null {
  const key = generateCacheKey('history', search.toLowerCase(), type);
  const item = historyCache.get(key);
  
  if (isCacheValid(item)) {
    console.log(`[Cache] Hit for history: ${search} (${type})`);
    return item.data;
  }
  
  return null;
}

/**
 * 設置歷史記錄快取
 */
export function setHistoryCache(search: string, type: string, data: MarketHistoryRecord[]): void {
  const key = generateCacheKey('history', search.toLowerCase(), type);
  
  historyCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: CACHE_CONFIG.HISTORY_DATA_TTL,
  });
  
  // 清理過期快取
  cleanExpiredCache(historyCache);
  // 限制快取大小
  limitCacheSize(historyCache, CACHE_CONFIG.MAX_CACHE_SIZE);
  
  console.log(`[Cache] Set for history: ${search} (${type})`);
}

/**
 * 清除所有快取
 */
export function clearAllCache(): void {
  marketCache.clear();
  historyCache.clear();
  console.log('[Cache] All cache cleared');
}

/**
 * 獲取快取統計資訊
 */
export function getCacheStats(): {
  marketCacheSize: number;
  historyCacheSize: number;
} {
  return {
    marketCacheSize: marketCache.size,
    historyCacheSize: historyCache.size,
  };
}