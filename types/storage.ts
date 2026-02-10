/**
 * 本地存儲數據類型定義
 */

import type { TrackedItem } from './messages';

export interface StorageData {
  trackedItems: TrackedItem[];
}

export type StorageKey = keyof StorageData;
