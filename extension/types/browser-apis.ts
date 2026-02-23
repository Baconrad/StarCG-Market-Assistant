/**
 * Browser API 全局類型定義
 * 僅補充 @types/chrome 沒有的部分
 */

// 聲明全局 browser 對象（Firefox）
declare global {
  interface Window {
    browser?: typeof chrome;
  }
}

// 擴展 browser.runtime 類型（標準 WebExtensions API）
declare namespace browser {
  namespace runtime {
    function sendMessage(message: any): Promise<any>;

    const onMessage: {
      addListener(
        callback: (
          message: any,
          sender: any,
          sendResponse: (response: any) => void
        ) => boolean | void
      ): void;
      removeListener(
        callback: (
          message: any,
          sender: any,
          sendResponse: (response: any) => void
        ) => boolean | void
      ): void;
    };

    function getURL(path: string): string;
  }

  namespace storage {
    namespace local {
      function get(keys?: string | string[]): Promise<Record<string, any>>;

      function set(items: Record<string, any>): Promise<void>;

      function remove(keys: string | string[]): Promise<void>;

      function clear(): Promise<void>;
    }
  }
}

export {};