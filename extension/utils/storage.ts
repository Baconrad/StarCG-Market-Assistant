/**
 * 統一的本地存儲工具
 * 隱藏 browser vs chrome storage API 的差異
 */

import type { StorageData, StorageKey } from '@/types/storage';

/**
 * 從存儲中獲取值
 */
export async function getStorage<K extends StorageKey>(
  key: K
): Promise<StorageData[K] | undefined> {
  try {
    // 優先使用 browser.storage（Firefox/標準品）
    if (typeof browser !== 'undefined' && browser.storage?.local) {
      const result = await browser.storage.local.get(key);
      return result?.[key] as StorageData[K] | undefined;
    }

    // Fallback 到 chrome.storage（Chrome/Chromium）
    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return await new Promise((resolve) => {
        // @ts-ignore
        chrome.storage.local.get(key, (result: Record<string, any>) => {
          resolve(result?.[key] as StorageData[K] | undefined);
        });
      });
    }

    // Fallback 到 localStorage（用於開發或無 API 環境）
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored) as StorageData[K];
      } catch {
        return undefined;
      }
    }

    return undefined;
  } catch (error) {
    console.error(`Failed to get storage key "${key}":`, error);
    return undefined;
  }
}

/**
 * 向存儲中設置值
 */
export async function setStorage<K extends StorageKey>(
  key: K,
  value: StorageData[K]
): Promise<void> {
  try {
    const data = { [key]: value };

    // 優先使用 browser.storage（Firefox/標準品）
    if (typeof browser !== 'undefined' && browser.storage?.local) {
      await browser.storage.local.set(data);
      return;
    }

    // Fallback 到 chrome.storage（Chrome/Chromium）
    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await new Promise<void>((resolve) => {
        // @ts-ignore
        chrome.storage.local.set(data, () => {
          resolve();
        });
      });
      return;
    }

    // Fallback 到 localStorage（用於開發）
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set storage key "${key}":`, error);
    throw error;
  }
}

/**
 * 從存儲中移除值
 */
export async function removeStorage(key: StorageKey): Promise<void> {
  try {
    if (typeof browser !== 'undefined' && browser.storage?.local) {
      await browser.storage.local.remove(key);
      return;
    }

    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await new Promise<void>((resolve) => {
        // @ts-ignore
        chrome.storage.local.remove(key, () => {
          resolve();
        });
      });
      return;
    }

    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove storage key "${key}":`, error);
    throw error;
  }
}

/**
 * 清空存儲
 */
export async function clearStorage(): Promise<void> {
  try {
    if (typeof browser !== 'undefined' && browser.storage?.local) {
      await browser.storage.local.clear();
      return;
    }

    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await new Promise<void>((resolve) => {
        // @ts-ignore
        chrome.storage.local.clear(() => {
          resolve();
        });
      });
      return;
    }

    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw error;
  }
}

// ========== Settings 便捷函數 ==========

import type { AppSettings } from '@/types/storage';
import { STORAGE_DEFAULTS } from '@/types/storage';

/**
 * 獲取應用設定
 */
export async function getSettings(): Promise<AppSettings> {
  const settings = await getStorage('settings');
  return {
    ...STORAGE_DEFAULTS.settings,
    ...settings,
  };
}

/**
 * 設置應用設定
 */
export async function setSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await setStorage('settings', { ...current, ...settings });
}

/**
 * 更新單一設定值
 */
export async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const settings = await getSettings();
  settings[key] = value;
  await setStorage('settings', settings);
}
