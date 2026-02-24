/**
 * 訊息類型定義 - 共用類型
 */

import type { MarketStall, MarketItem, MarketPet, MarketHistoryRecord } from './market';

// 重新導出 MarketHistoryRecord 以供其他模組使用
export type { MarketHistoryRecord } from './market';

// 追蹤項目類型
export interface TrackedItem {
  name: string;
  type: 'item' | 'pet';
  addedAt: number;
  // optional display helpers used by popup UI
  price?: number;
  priceType?: '0' | '1';
  stall?: string;
  minPrice?: number;
  avgPrice?: number;
  lastUpdated?: number;
  historyData?: MarketHistoryRecord[];
}

// === 消息定義 ===

// 基礎消息結構
export interface Message {
  type: string;
}

// fetchMarket 消息
export interface FetchMarketMessage extends Message {
  type: 'fetchMarket';
  search: string;
}

// fetchMarket 響應
export interface FetchMarketResponse {
  success: boolean;
  stalls?: MarketStall[];
  itemsByCd?: Record<string, MarketItem[]>;
  petsByCd?: Record<string, MarketPet[]>;
  message?: string;
}

// addTracked 消息
export interface AddTrackedMessage extends Message {
  type: 'addTracked';
  item: TrackedItem;
}

// addTracked 響應
export interface AddTrackedResponse {
  success: boolean;
  message?: string;
}

// 所有消息的聯合類型
export type AnyMessage =
  | FetchMarketMessage
  | AddTrackedMessage;

// 對應的響應類型
export type MessageResponse =
  | FetchMarketResponse
  | AddTrackedResponse;