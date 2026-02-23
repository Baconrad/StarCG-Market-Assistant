import { onMessage } from '@/utils/messaging';
import { getStorage, setStorage } from '@/utils/storage';
import {
  fetchAllMarketPages,
  filterMarketDataBySearch,
} from '@/utils/api';
import type {
  FetchMarketMessage,
  AddTrackedMessage,
  FetchMarketResponse,
  AddTrackedResponse,
  AnyMessage,
  MessageResponse,
} from '@/types/messages';

export default defineBackground(() => {
  console.log('Background service worker loaded');

  // 監聽來自外部的消息（網頁端檢查擴充功能是否安裝 + API 代理請求）
  chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    // 檢查擴充功能是否安裝
    if (request.type === 'CHECK_INSTALLED') {
      sendResponse({ installed: true, version: '1.0' });
      return true;
    }
    
    // 處理 API 代理請求
    if (request.type === 'FETCH_MARKET') {
      handleFetchMarketProxy(request.data, sendResponse);
      return true;
    }
    
    if (request.type === 'FETCH_MARKET_ALL') {
      handleFetchMarketAllProxy(request.data, sendResponse);
      return true;
    }
    
    if (request.type === 'FETCH_HISTORY') {
      handleFetchHistoryProxy(request.data, sendResponse);
      return true;
    }
    
    // 處理新增追蹤
    if (request.type === 'ADD_TRACKED') {
      handleAddTrackedProxy(request.data, sendResponse);
      return true;
    }
    
    // 處理移除追蹤
    if (request.type === 'REMOVE_TRACKED') {
      handleRemoveTrackedProxy(request.data, sendResponse);
      return true;
    }
    
    // 處理取得追蹤列表
    if (request.type === 'GET_TRACKED') {
      handleGetTrackedProxy(sendResponse);
      return true;
    }
    
    // 處理更新追蹤項目
    if (request.type === 'UPDATE_TRACKED') {
      handleUpdateTrackedProxy(request.data, sendResponse);
      return true;
    }
    
    return false;
  });

  // 初始化 API 模組
  initApiModule();

  // 註冊消息監聽
  onMessage(async (message: AnyMessage): Promise<MessageResponse | void> => {
    if (!message || !message.type) {
      return { success: true };
    }

    try {
      // 使用 switch 語句處理不同的消息類型
      if ((message as any).type === 'fetchMarket') {
        return await handleFetchMarket(message as FetchMarketMessage);
      } else if ((message as any).type === 'addTracked') {
        return await handleAddTracked(message as AddTrackedMessage);
      } else {
        throw new Error(`Unknown message type: ${(message as any).type}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Error handling message:`, errorMsg);
      return { success: false, message: errorMsg };
    }
  });
});

/**
 * 處理市場搜尋請求
 */
async function handleFetchMarket(
  message: FetchMarketMessage
): Promise<FetchMarketResponse> {
  const search = message.search || '';

  try {
    // 獲取所有分頁的數據
    let data = await fetchAllMarketPages(search);

    // 根據搜尋文本過濾
    if (search.trim()) {
      data = filterMarketDataBySearch(data, search);
    }

    return {
      success: true,
      stalls: data.stalls,
      itemsByCd: data.itemsByCd,
      petsByCd: data.petsByCd,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to fetch market data: ${errorMsg}`,
    };
  }
}

/**
 * 處理追蹤項目請求
 */
async function handleAddTracked(
  message: AddTrackedMessage
): Promise<AddTrackedResponse> {
  const item = message.item;

  if (!item) {
    return { success: false, message: 'Item data is required' };
  }

  try {
    // 獲取現有的追蹤項目列表
    const trackedItems = (await getStorage('trackedItems')) || [];

    // 添加新項目到列表開始
    trackedItems.unshift(item);

    // 保存更新後的列表
    await setStorage('trackedItems', trackedItems);

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to add tracked item: ${errorMsg}`,
    };
  }
}

// ========== API 代理處理函數 ==========

import { fetchMarketData, fetchMarketHistory } from '@/utils/api';

/**
 * 處理單頁市場數據請求（代理）
 */
async function handleFetchMarketProxy(
  data: { search: string; page?: number },
  sendResponse: (response: any) => void
) {
  try {
    const result = await fetchMarketData(data.search, data.page || 1);
    sendResponse({ success: true, data: result });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    sendResponse({ success: false, message: errorMsg });
  }
}

/**
 * 處理所有分頁市場數據請求（代理）
 */
async function handleFetchMarketAllProxy(
  data: { search: string },
  sendResponse: (response: any) => void
) {
  try {
    const result = await fetchAllMarketPages(data.search);
    sendResponse({ success: true, data: result });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    sendResponse({ success: false, message: errorMsg });
  }
}

/**
 * 處理歷史成交記錄請求（代理）
 */
async function handleFetchHistoryProxy(
  data: { search: string; type?: string; maxPages?: number },
  sendResponse: (response: any) => void
) {
  try {
    const result = await fetchMarketHistory(
      data.search,
      (data.type as any) || 'all',
      data.maxPages || 3
    );
    sendResponse({ success: true, data: result });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    sendResponse({ success: false, message: errorMsg });
  }
}

/**
 * 初始化 API 模組
 */
function initApiModule() {
  console.log('API module initialized for external requests');
}

// ========== 追蹤代理處理函數 ==========

/**
 * 處理新增追蹤（代理）
 */
async function handleAddTrackedProxy(
  data: { item: any },
  sendResponse: (response: any) => void
) {
  try {
    const trackedItems = (await getStorage('trackedItems')) || [];
    // 檢查是否已存在
    if (!trackedItems.some((i: any) => i.name === data.item.name)) {
      trackedItems.unshift(data.item);
      await setStorage('trackedItems', trackedItems);
    }
    sendResponse({ success: true, data: trackedItems });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    sendResponse({ success: false, message: errorMsg });
  }
}

/**
 * 處理移除追蹤（代理）
 */
async function handleRemoveTrackedProxy(
  data: { name: string },
  sendResponse: (response: any) => void
) {
  try {
    const trackedItems = (await getStorage('trackedItems')) || [];
    const filtered = trackedItems.filter((i: any) => i.name !== data.name);
    await setStorage('trackedItems', filtered);
    sendResponse({ success: true, data: filtered });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    sendResponse({ success: false, message: errorMsg });
  }
}

/**
 * 處理取得追蹤列表（代理）
 */
async function handleGetTrackedProxy(
  sendResponse: (response: any) => void
) {
  try {
    const trackedItems = (await getStorage('trackedItems')) || [];
    sendResponse({ success: true, data: trackedItems });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    sendResponse({ success: false, message: errorMsg });
  }
}

/**
 * 處理更新追蹤項目（代理）
 */
async function handleUpdateTrackedProxy(
  data: { name: string; updates: any },
  sendResponse: (response: any) => void
) {
  try {
    const trackedItems = (await getStorage('trackedItems')) || [];
    const index = trackedItems.findIndex((i: any) => i.name === data.name)
    if (index !== -1) {
      trackedItems[index] = { ...trackedItems[index], ...data.updates }
      await setStorage('trackedItems', trackedItems)
    }
    sendResponse({ success: true, data: trackedItems });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    sendResponse({ success: false, message: errorMsg });
  }
}

