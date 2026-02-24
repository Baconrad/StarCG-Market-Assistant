/**
 * 存儲類型定義 - 共用類型
 */

import type { TrackedItem } from './messages';

// 更新頻率選項（分鐘）
export type UpdateInterval = 30 | 60 | 120 | 360;

// 應用設定
export interface AppSettings {
  autoUpdateEnabled: boolean;      // 自動更新開關，預設 false
  updateInterval: UpdateInterval;  // 更新頻率（分鐘），預設 60
  notifyEnabled: boolean;          // 通知開關，預設 true
}

export interface StorageData {
  trackedItems: TrackedItem[];
  magicCrystalRatio: number;
  settings: AppSettings;
}

export type StorageKey = keyof StorageData;

// 預設值
export const STORAGE_DEFAULTS = {
  magicCrystalRatio: 175,
  trackedItems: [],
  settings: {
    autoUpdateEnabled: false,
    updateInterval: 60,
    notifyEnabled: true,
  } as AppSettings,
} as const;