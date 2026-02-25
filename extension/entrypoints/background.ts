import { onMessage } from '@/utils/messaging';
import { getStorage, setStorage, getSettings, setSettings } from '@/utils/storage';
import {
  fetchAllMarketPages,
  filterMarketDataBySearch,
  fetchMarketHistory,
} from '@/utils/api';
import {
  getMarketCache,
  setMarketCache,
  getHistoryCache,
  setHistoryCache,
  clearAllCache,
} from '@/utils/cache';
import type {
  FetchMarketMessage,
  AddTrackedMessage,
  FetchMarketResponse,
  AddTrackedResponse,
  AnyMessage,
  MessageResponse,
  TrackedItem,
} from '@/types/messages';

// ========== 常量定義 ==========

const ALARM_NAME = 'priceUpdate';
const WEB_URL = 'https://baconrad.github.io/StarCG-Market-Assistant/';

// ========== Background Entry Point ==========

export default defineBackground(() => {
  console.log('Background service worker loaded');

  // 初始化 alarm
  initAlarm();

  // 初始化通知點擊處理
  initNotificationHandler();

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

    // 處理取得設定
    if (request.type === 'GET_SETTINGS') {
      handleGetSettingsProxy(sendResponse);
      return true;
    }

    // 處理更新設定
    if (request.type === 'UPDATE_SETTINGS') {
      handleUpdateSettingsProxy(request.data, sendResponse);
      return true;
    }

    // 處理通知測試
    if (request.type === 'TEST_NOTIFICATION') {
      sendTestNotification();
      sendResponse({ success: true });
      return true;
    }
    
    return false;
  });

  // 初始化 API 模組
  initApiModule();

  // 監聽來自內部的消息（options page 等）
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 處理取得設定
    if (request.type === 'GET_SETTINGS') {
      handleGetSettingsProxy(sendResponse);
      return true;
    }

    // 處理更新設定
    if (request.type === 'UPDATE_SETTINGS') {
      handleUpdateSettingsProxy(request.data, sendResponse);
      return true;
    }

    // 處理通知測試
    if (request.type === 'TEST_NOTIFICATION') {
      sendTestNotification();
      sendResponse({ success: true });
      return true;
    }

    return false;
  });

  // 註冊消息監聽（用於 WXT 內部通訊）
  onMessage(async (message: AnyMessage): Promise<MessageResponse | void> => {
    if (!message || !message.type) {
      return { success: true };
    }

    const messageType = (message as any).type;

    // 忽略已由 chrome.runtime.onMessage 處理的訊息類型
    const handledTypes = ['GET_SETTINGS', 'UPDATE_SETTINGS', 'TEST_NOTIFICATION'];
    if (handledTypes.includes(messageType)) {
      return { success: true };
    }

    try {
      // 使用 switch 語句處理不同的消息類型
      if (messageType === 'fetchMarket') {
        return await handleFetchMarket(message as FetchMarketMessage);
      } else if (messageType === 'addTracked') {
        return await handleAddTracked(message as AddTrackedMessage);
      } else {
        // 不再拋出錯誤，只記錄並返回成功
        console.log(`Unhandled message type: ${messageType}`);
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Error handling message:`, errorMsg);
      return { success: false, message: errorMsg };
    }
  });
});

// ========== Alarm 相關函數 ==========

/**
 * 初始化 alarm
 */
function initAlarm() {
  // 創建每 1 分鐘觸發的 alarm
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });

  // 監聽 alarm
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
      await checkAndUpdatePrices();
    }
  });

  console.log('Price update alarm initialized');
}

/**
 * 檢查並更新價格
 * 每 1 分鐘檢查一次，只更新一個商品
 */
async function checkAndUpdatePrices() {
  try {
    // 1. 檢查是否開啟自動更新
    const settings = await getSettings();
    if (!settings.autoUpdateEnabled) {
      return;
    }

    // 2. 取得追蹤清單
    const trackedItems = (await getStorage('trackedItems')) || [];
    if (trackedItems.length === 0) {
      return;
    }

    const now = Date.now();
    const intervalMs = settings.updateInterval * 60 * 1000; // 轉毫秒

    // 3. 找出需要更新的商品（按 lastUpdated 排序，最舊的優先）
    const needsUpdate = trackedItems
      .filter((item: TrackedItem) => {
        if (!item.lastUpdated) return true;
        return (now - item.lastUpdated) >= intervalMs;
      })
      .sort((a: TrackedItem, b: TrackedItem) => {
        return (a.lastUpdated || 0) - (b.lastUpdated || 0);
      });

    if (needsUpdate.length === 0) {
      return;
    }

    // 4. 只更新第一個商品
    const itemToUpdate = needsUpdate[0];
    console.log(`Updating price for: ${itemToUpdate.name}`);
    await updateSingleItemPrice(itemToUpdate, trackedItems, settings.notifyEnabled);

  } catch (error) {
    console.error('Error in checkAndUpdatePrices:', error);
  }
}

/**
 * 更新單一商品的價格
 */
async function updateSingleItemPrice(
  item: TrackedItem,
  trackedItems: TrackedItem[],
  notifyEnabled: boolean
) {
  try {
    // 呼叫 API 取得歷史成交價
    const historyType = item.type === 'pet' ? 'pet' : 'item';
    const history = await fetchMarketHistory(item.name, historyType, 3);

    if (!history || history.length === 0) {
      // 沒有歷史資料，只更新時間
      const index = trackedItems.findIndex((i) => i.name === item.name);
      if (index !== -1) {
        trackedItems[index] = {
          ...trackedItems[index],
          lastUpdated: Date.now(),
        };
        await setStorage('trackedItems', trackedItems);
      }
      return;
    }

    // 計算新的最低價和平均價
    const prices = history.map((h) => h.price);
    const newMinPrice = Math.min(...prices);
    const newAvgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const oldMinPrice = item.minPrice;

    // 更新 storage
    const index = trackedItems.findIndex((i) => i.name === item.name);
    if (index !== -1) {
      trackedItems[index] = {
        ...trackedItems[index],
        minPrice: newMinPrice,
        avgPrice: newAvgPrice,
        lastUpdated: Date.now(),
        historyData: history,
      };
      await setStorage('trackedItems', trackedItems);
    }

    // 檢查是否需要通知（新價格 < 舊價格）
    if (notifyEnabled && oldMinPrice !== undefined && newMinPrice < oldMinPrice) {
      sendPriceDropNotification(item, oldMinPrice, newMinPrice);
    }

    console.log(`Updated ${item.name}: minPrice ${oldMinPrice} -> ${newMinPrice}`);

  } catch (error) {
    console.error(`Error updating price for ${item.name}:`, error);
  }
}

// ========== 通知相關函數 ==========

/**
 * 初始化通知點擊處理
 */
function initNotificationHandler() {
  chrome.notifications.onClicked.addListener((notificationId) => {
    // 點擊通知後開啟追蹤清單頁面
    chrome.tabs.create({ url: `${WEB_URL}#/tracked` });
    chrome.notifications.clear(notificationId);
  });
}

/**
 * 發送價格下降通知
 */
function sendPriceDropNotification(
  item: TrackedItem,
  oldPrice: number,
  newPrice: number
) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/logo.png',
    title: `💰 ${item.name} 價格下降！`,
    message: `最低價從 ${formatPrice(oldPrice)} 降至 ${formatPrice(newPrice)}`,
    priority: 2,
  });

  console.log(`Notification sent for ${item.name}: ${oldPrice} -> ${newPrice}`);
}

/**
 * 發送測試通知
 */
function sendTestNotification() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/logo.png',
    title: '📢 測試通知',
    message: '這是一則測試通知，通知功能運作正常！',
    priority: 1,
  });

  console.log('Test notification sent');
}

// ========== 原有的處理函數 ==========

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
    // 檢查快取
    const cached = getMarketCache(data.search);
    if (cached) {
      sendResponse({ success: true, data: cached, fromCache: true });
      return;
    }

    const result = await fetchAllMarketPages(data.search);
    
    // 存入快取
    setMarketCache(data.search, result);
    
    sendResponse({ success: true, data: result, fromCache: false });
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
    const type = (data.type as string) || 'all';
    
    // 檢查快取
    const cached = getHistoryCache(data.search, type);
    if (cached) {
      sendResponse({ success: true, data: cached, fromCache: true });
      return;
    }

    const result = await fetchMarketHistory(
      data.search,
      type as any,
      data.maxPages || 3
    );
    
    // 存入快取
    setHistoryCache(data.search, type, result);
    
    sendResponse({ success: true, data: result, fromCache: false });
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

// ========== 設定代理處理函數 ==========

import type { AppSettings } from '@/types/storage';

/**
 * 處理取得設定（代理）
 */
async function handleGetSettingsProxy(
  sendResponse: (response: any) => void
) {
  try {
    const settings = await getSettings();
    sendResponse({ success: true, data: settings });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    sendResponse({ success: false, message: errorMsg });
  }
}

/**
 * 處理更新設定（代理）
 */
async function handleUpdateSettingsProxy(
  data: Partial<AppSettings>,
  sendResponse: (response: any) => void
) {
  try {
    await setSettings(data);
    const settings = await getSettings();
    sendResponse({ success: true, data: settings });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    sendResponse({ success: false, message: errorMsg });
  }
}
