/**
 * 本地存儲數據類型定義
 */

import type { TrackedItem } from './messages';

export interface StorageData {
  trackedItems: TrackedItem[];
  magicCrystalRatio: number;
}

export type StorageKey = keyof StorageData;

// 預設值
export const STORAGE_DEFAULTS = {
  magicCrystalRatio: 175,
  trackedItems: [],
} as const;
