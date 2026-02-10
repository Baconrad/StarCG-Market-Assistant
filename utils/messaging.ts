/**
 * 統一的消息發送和監聽工具
 * 隱藏 browser vs chrome API 的差異
 */

import type { AnyMessage, MessageResponse } from '@/types/messages';

/**
 * 發送消息到 background service worker
 * 自動處理 browser.runtime 和 chrome.runtime 的差異
 */
export async function sendMessage<T extends MessageResponse = MessageResponse>(
  message: AnyMessage
): Promise<T> {
  try {
    // 優先使用 browser.runtime（Firefox/標準品）
    if (typeof browser !== 'undefined' && browser.runtime?.sendMessage) {
      return await (browser.runtime.sendMessage(message) as Promise<T>);
    }

    // Fallback 到 chrome.runtime（Chrome/Chromium）
    // @ts-ignore - chrome 是全局對象，在 extension 環境中存在
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      return await new Promise((resolve, reject) => {
        // @ts-ignore
        chrome.runtime.sendMessage(message, (response: T | undefined) => {
          // @ts-ignore
          if (chrome.runtime.lastError) {
            // @ts-ignore
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response || ({} as T));
          }
        });
      });
    }

    throw new Error('Extension runtime not available');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to send message: ${errorMsg}`);
  }
}

/**
 * 添加消息監聽（用於 background service worker）
 * 返回清除監聽的函數
 */
export function onMessage(
  handler: (message: AnyMessage, sender?: any) => Promise<MessageResponse | void> | MessageResponse | void
): () => void {
  if (typeof browser !== 'undefined' && browser.runtime?.onMessage) {
    const listener = (msg: AnyMessage, sender: any, sendResponse: (response: any) => void) => {
      (async () => {
        try {
          const result = await Promise.resolve(handler(msg, sender));
          sendResponse(result || {});
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          sendResponse({ success: false, message: errorMsg });
        }
      })();
      return true; // 表示異步響應
    };

    browser.runtime.onMessage.addListener(listener);

    // 返回清除函數
    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }

  // @ts-ignore - chrome 是全局對象
  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    const listener = (msg: AnyMessage, sender: any, sendResponse: (response: any) => void) => {
      (async () => {
        try {
          const result = await Promise.resolve(handler(msg, sender));
          sendResponse(result || {});
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          sendResponse({ success: false, message: errorMsg });
        }
      })();
      return true;
    };

    // @ts-ignore
    chrome.runtime.onMessage.addListener(listener);

    return () => {
      // @ts-ignore
      chrome.runtime.onMessage.removeListener(listener);
    };
  }

  // 如果都不可用，返回空函數
  return () => {};
}

/**
 * 獲取擴展資源 URL
 */
export function getExtensionUrl(path: string): string {
  try {
    if (typeof browser !== 'undefined' && browser.runtime?.getURL) {
      return browser.runtime.getURL(path as any);
    }
    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      // @ts-ignore
      return chrome.runtime.getURL(path);
    }
  } catch {
    // 忽略錯誤
  }
  return path;
}
