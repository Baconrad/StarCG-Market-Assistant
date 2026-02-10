/**
 * Browser/Chrome API 全局類型定義
 * 避免 "Cannot find name 'chrome'" 錯誤
 */

// 聲明全局 browser 對象（Firefox）
declare global {
  interface Window {
    browser?: typeof browser;
  }
}

// 聲明全局 chrome 對象（Chrome/Chromium）
declare global {
  interface Window {
    chrome?: typeof chrome;
  }
}

// 擴展 chrome.runtime 類型
declare namespace chrome {
  namespace runtime {
    interface LastError {
      message?: string;
    }

    function sendMessage(
      message: any,
      responseCallback?: (response: any) => void
    ): void;

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

    const lastError: LastError | undefined;
  }

  namespace storage {
    namespace local {
      function get(
        keys: string | string[],
        callback: (items: Record<string, any>) => void
      ): void;

      function set(items: Record<string, any>, callback?: () => void): void;

      function remove(keys: string | string[], callback?: () => void): void;

      function clear(callback?: () => void): void;
    }
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
