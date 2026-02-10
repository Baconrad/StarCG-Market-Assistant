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

