/**
 * 市場 API 服務層 (Web 版)
 * 透過 Extension Background Script 代理請求以避免 CORS
 */

import type {
  MarketApiResponse,
  MarketHistoryRecord,
} from '@/types/market';
import { sendExtensionMessage as sendExtensionMsg } from './extension';

/**
 * 透過 Extension 代理發送 API 請求
 */
async function sendExtensionMessage(type: string, data: any): Promise<any> {
  const response = await sendExtensionMsg<{ success: boolean; data?: any; message?: string }>({
    type,
    data
  });
  
  if (response === null) {
    throw new Error('Extension not available');
  }
  
  if (response?.success) {
    return response.data;
  } else {
    throw new Error(response?.message || 'Unknown error');
  }
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
