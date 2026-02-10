/**
 * 市場數據類型定義
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
