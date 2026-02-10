/**
 * 常量定義
 */

// API 相關常量
export const API_CONFIG = {
  BASE_URL: 'https://member.starcg.net',
  MARKET_ENDPOINT: '/market.php',
  // 查詢參數
  QUERY_PARAMS: {
    ajax: '1',
    type: 'all',
    server: 'all',
    exact: '0',
  },
} as const;

// 市場相關常量
export const MARKET_CONFIG = {
  DEFAULT_MAGIC_CRYSTAL_RATIO: 175,
  DEFAULT_PAGE_SIZE: 100,
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
} as const;

// 錯誤消息
export const ERROR_MESSAGES = {
  FETCH_FAILED: '搜尋失敗',
  NO_RESULTS: '查詢無結果',
  FETCH_TIMEOUT: '搜尋超時，請稍後重試',
  ADD_TRACKED_FAILED: '加入追蹤失敗',
  RUNTIME_NOT_AVAILABLE: '無法連接至背景服務',
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  ITEM_TRACKED: '已加入追蹤',
} as const;
