/**
 * 統一的消息類型定義
 * 用於 background service worker 和 content script/popup 之間的通信
 */

// 市場搜尋相關的API的響應類型
export interface MarketApiResponse {
  stalls: MarketStall[];
  itemsByCd: Record<string, MarketItem[]>;
  petsByCd: Record<string, MarketPet[]>;
  totalFiltered?: number;
}

export interface MarketStall {
  cdkey?: string;
  cdKey?: string;
  cd?: string;
  CDKEY?: string;
  name?: string;
  stall_name?: string;
  storename?: string;
  server?: string;
  server_name?: string;
  X?: number;
  x?: number;
  Y?: number;
  y?: number;
  coords?: string;
  start_time?: string;
  time?: string;
  created_at?: string;
}

export interface MarketItem {
  ITEM_TRUENAME?: string;
  name?: string;
  itemName?: string;
  price?: number;
  Price?: number;
  pricetype?: string;
  priceType?: string;
  ITEM_BASEIMAGENUMBER?: string;
}

export interface MarketPet {
  UserPetName?: string;
  Name?: string;
  petName?: string;
  Lv?: string;
  price?: number;
  pricetype?: string;
  Basebaseimgnum?: string;
}

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

export interface MarketHistoryRecord {
  id: number;
  price: number;
  priceType: '0' | '1';
  time: number;
  timeText: string;
  buff: string;
  buyerName: string;
}

export interface MarketHistoryResponse {
  page: number;
  perPage: number;
  totalFiltered: number;
  logs: {
    id: number;
    cdkey: string;
    buycdkey: string;
    buyname: string;
    buff: string;
    price: number;
    pricetype: number;
    time: number;
    check: number;
    time_text: string;
  }[];
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
