/**
 * 市場 API 服務層
 * 封裝所有 API 調用邏輯
 */

import type {
  MarketApiResponse,
  MarketStall,
  MarketItem,
  MarketPet,
  MarketHistoryResponse,
  MarketHistoryRecord,
} from '@/types/messages';
import { API_CONFIG, MARKET_CONFIG } from './constants';

/**
 * 從 API 獲取市場數據
 * 支持分頁和搜尋
 */
export async function fetchMarketData(
  searchText: string,
  page: number = 1
): Promise<MarketApiResponse> {
  const params = new URLSearchParams({
    ...API_CONFIG.QUERY_PARAMS,
    page: String(page),
    search: searchText,
  });

  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.MARKET_ENDPOINT}?${params}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MARKET_CONFIG.TIMEOUT_MS);

    const response = await fetch(url, {
      credentials: 'omit',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return normalizeApiResponse(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch market data: ${errorMsg}`);
  }
}

/**
 * 遞迴獲取所有分頁的市場數據
 */
export async function fetchAllMarketPages(searchText: string): Promise<MarketApiResponse> {
  const stalls: MarketStall[] = [];
  const itemsByCd: Record<string, MarketItem[]> = {};
  const petsByCd: Record<string, MarketPet[]> = {};
  let page = 1;
  let totalFiltered = 0;

  while (true) {
    try {
      const data = await fetchMarketData(searchText, page);

      // 合併數據
      stalls.push(...(data.stalls || []));
      Object.assign(itemsByCd, data.itemsByCd || {});
      Object.assign(petsByCd, data.petsByCd || {});

      totalFiltered = data.totalFiltered || (stalls.length + totalFiltered);

      // 檢查是否已獲取所有數據
      if (stalls.length >= totalFiltered) break;
      if (!data.stalls || data.stalls.length === 0) break;

      page += 1;
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      // 如果已經有數據，延續使用；否則拋出錯誤
      if (stalls.length === 0) throw error;
      break;
    }
  }

  return { stalls, itemsByCd, petsByCd, totalFiltered };
}

/**
 * 規範化 API 響應的數據結構
 * 因為 API 可能返回不同的字段名
 */
function normalizeApiResponse(data: any): MarketApiResponse {
  return {
    stalls: data.stalls || data.data?.stalls || [],
    itemsByCd: data.itemsByCd || data.data?.itemsByCd || {},
    petsByCd: data.petsByCd || data.data?.petsByCd || {},
    totalFiltered: data.totalFiltered ?? data.data?.totalFiltered,
  };
}

/**
 * 根據搜尋文本過濾物品和寵物
 * 支持按名稱大小寫不敏感搜尋
 */
export function filterMarketDataBySearch(
  data: MarketApiResponse,
  searchText: string
): MarketApiResponse {
  if (!searchText.trim()) {
    return data;
  }

  const lowerCaseSearch = searchText.toLowerCase();
  const validCdKeys = new Set<string>();

  // 過濾物品
  for (const cdkey in data.itemsByCd) {
    const items = data.itemsByCd[cdkey];
    const filteredItems = items.filter((item) =>
      (item.ITEM_TRUENAME || '').toLowerCase().includes(lowerCaseSearch)
    );

    if (filteredItems.length > 0) {
      data.itemsByCd[cdkey] = filteredItems;
      validCdKeys.add(cdkey);
    } else {
      delete data.itemsByCd[cdkey];
    }
  }

  // 過濾寵物
  for (const cdkey in data.petsByCd) {
    const pets = data.petsByCd[cdkey];
    const filteredPets = pets.filter((pet) =>
      (pet.Name || '').toLowerCase().includes(lowerCaseSearch)
    );

    if (filteredPets.length > 0) {
      data.petsByCd[cdkey] = filteredPets;
      validCdKeys.add(cdkey);
    } else {
      delete data.petsByCd[cdkey];
    }
  }

  // 過濾攤位
  data.stalls = data.stalls.filter((stall) =>
    validCdKeys.has(stall.cdkey ?? stall.cdKey ?? stall.cd ?? stall.CDKEY ?? '')
  );

  return data;
}

/**
 * 從市場數據提取物品坐標
 */
export function extractStallCoordinates(stall: MarketStall): string {
  return stall.coords ?? `${stall.X ?? stall.x ?? ''},${stall.Y ?? stall.y ?? ''}`;
}

/**
 * 從市場數據提取與規範化斷點 key
 */
export function extractCdKey(stall: MarketStall): string {
  return stall.cdkey ?? stall.cdKey ?? stall.cd ?? stall.CDKEY ?? '';
}

/**
 * 從市場數據提取推理過期時間
 */
export function getTimeUntilExpiration(timestamp: string): string {
  if (!timestamp) return '';

  const now = new Date();
  const past = new Date(Number(timestamp) * 1000);
  const diff = past.getTime() - now.getTime();

  if (diff <= 0) return '已到期';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `剩 ${days} 天`;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `剩 ${hours} 小時`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `剩 ${minutes} 分鐘`;
}

/**
 * 獲取歷史成交記錄
 * @param search 搜尋關鍵字
 * @param type 類型: all | pet | item
 * @param maxPages 最大頁數（預設3頁）
 */
export async function fetchMarketHistory(
  search: string,
  type: 'all' | 'pet' | 'item' = 'all',
  maxPages: number = 3
): Promise<MarketHistoryRecord[]> {
  const allRecords: MarketHistoryRecord[] = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `https://member.starcg.net/marketrecord.php?ajax=1&page=${page}&search=${encodeURIComponent(search)}&type=${type}`;

      const response = await fetch(url, {
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: MarketHistoryResponse = await response.json();

      if (!data.logs || data.logs.length === 0) {
        break;
      }

      // 過濾符合條件的記錄（buff 必須完全匹配）
      const filteredLogs = data.logs.filter((log) => {
        // 預期的 buff 格式: "購買1隻：{search}" 或 "購買1個：{search}"
        const expectedBuffPet = `購買1隻：${search}`;
        const expectedBuffItem = `購買1個：${search}`;
        return log.buff === expectedBuffPet || log.buff === expectedBuffItem;
      });

      const records: MarketHistoryRecord[] = filteredLogs.map((log) => ({
        id: log.id,
        price: log.price,
        priceType: String(log.pricetype) as '0' | '1',
        time: log.time,
        timeText: log.time_text,
        buff: log.buff,
        buyerName: log.buyname,
      }));

      allRecords.push(...records);

      // 如果已經沒有更多數據，提前退出
      if (data.logs.length < data.perPage) {
        break;
      }
    } catch (error) {
      console.error(`Error fetching history page ${page}:`, error);
      break;
    }
  }

  return allRecords;
}
