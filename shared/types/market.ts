/**
 * 市場數據類型定義 - 共用類型
 */

export type ItemType = 'item' | 'pet';
export type PriceType = '0' | '1'; // '0' = 金幣, '1' = 魔晶

export interface Payment {
  type: ItemType;
  name: string;
  price: number;
  priceType: PriceType;
  stallName: string;
  server: string;
  coords: string;
  x: number;
  y: number;
  startTime: string;
  iconId: string;
  sortablePrice?: number;
}

export interface ItemFilterOptions {
  nameFilter: string;
  typeFilter: ItemType | 'all';
  priceTypeFilter: PriceType | 'all';
  magicCrystalRatio: number;
}

// API 回應類型
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

// 歷史成交記錄
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