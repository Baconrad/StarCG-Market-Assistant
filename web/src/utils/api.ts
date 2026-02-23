/**
 * 市場 API 服務層 (Web 版)
 * 透過 Extension Background Script 代理請求以避免 CORS
 */

import type {
  MarketApiResponse,
  MarketHistoryRecord,
} from '@/types/messages';

// 從環境變數讀取擴充功能 ID
const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID || 'ooiofmpdcmcjclbbphgkfhcnebpomded';

/**
 * 透過 Extension 代理發送 API 請求
 */
async function sendExtensionMessage(type: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // @ts-ignore
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        reject(new Error('Extension not available'));
        return;
      }

      // @ts-ignore
      chrome.runtime.sendMessage(EXTENSION_ID, { type, data }, (response: any) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.message || 'Unknown error'));
        }
      });

      // 設定超時
      setTimeout(() => {
        reject(new Error('Extension request timeout'));
      }, 30000);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 獲取市場數據
 */
export async function fetchMarketData(
  searchText: string,
  page: number = 1
): Promise<MarketApiResponse> {
  return sendExtensionMessage('FETCH_MARKET', { search: searchText, page });
}

/**
 * 獲取所有分頁的市場數據
 */
export async function fetchAllMarketPages(searchText: string): Promise<MarketApiResponse> {
  return sendExtensionMessage('FETCH_MARKET_ALL', { search: searchText });
}

/**
 * 獲取歷史成交記錄
 */
export async function fetchMarketHistory(
  search: string,
  type: 'all' | 'pet' | 'item' = 'all',
  maxPages: number = 3
): Promise<MarketHistoryRecord[]> {
  return sendExtensionMessage('FETCH_HISTORY', { search, type, maxPages });
}
