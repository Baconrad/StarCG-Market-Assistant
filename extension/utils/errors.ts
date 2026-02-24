/**
 * 統一錯誤處理模組
 */

// 錯誤類型枚舉
export enum ErrorCode {
  // 網路錯誤
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  // API 錯誤
  API_ERROR = 'API_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  // 擴充功能錯誤
  EXTENSION_NOT_AVAILABLE = 'EXTENSION_NOT_AVAILABLE',
  STORAGE_ERROR = 'STORAGE_ERROR',
  // 使用者操作錯誤
  INVALID_INPUT = 'INVALID_INPUT',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  // 未知錯誤
  UNKNOWN = 'UNKNOWN',
}

// 錯誤訊息映射
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.NETWORK_ERROR]: '網路連線失敗，請檢查網路狀態',
  [ErrorCode.TIMEOUT]: '請求逾時，請稍後重試',
  [ErrorCode.API_ERROR]: 'API 服務異常，請稍後重試',
  [ErrorCode.INVALID_RESPONSE]: '伺服器回應格式錯誤',
  [ErrorCode.EXTENSION_NOT_AVAILABLE]: '擴充功能未啟用，請重新載入頁面',
  [ErrorCode.STORAGE_ERROR]: '儲存資料失敗',
  [ErrorCode.INVALID_INPUT]: '輸入資料格式錯誤',
  [ErrorCode.ITEM_NOT_FOUND]: '找不到指定項目',
  [ErrorCode.UNKNOWN]: '發生未知錯誤',
};

// 自定義錯誤類別
export class AppError extends Error {
  code: ErrorCode;
  originalError?: Error;

  constructor(code: ErrorCode, message?: string, originalError?: Error) {
    super(message || ERROR_MESSAGES[code]);
    this.code = code;
    this.originalError = originalError;
    this.name = 'AppError';
  }

  /**
   * 取得使用者友善的錯誤訊息
   */
  getUserMessage(): string {
    return this.message;
  }

  /**
   * 取得詳細錯誤資訊（用於 debug）
   */
  getDebugInfo(): string {
    return `[${this.code}] ${this.message}${this.originalError ? ` - ${this.originalError.message}` : ''}`;
  }
}

/**
 * 從原始錯誤建立 AppError
 */
export function createAppError(error: unknown, defaultCode: ErrorCode = ErrorCode.UNKNOWN): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // 根據錯誤訊息判斷錯誤類型
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('abort')) {
      return new AppError(ErrorCode.TIMEOUT, ERROR_MESSAGES[ErrorCode.TIMEOUT], error);
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return new AppError(ErrorCode.NETWORK_ERROR, ERROR_MESSAGES[ErrorCode.NETWORK_ERROR], error);
    }
    
    if (message.includes('extension not available')) {
      return new AppError(ErrorCode.EXTENSION_NOT_AVAILABLE, ERROR_MESSAGES[ErrorCode.EXTENSION_NOT_AVAILABLE], error);
    }

    return new AppError(defaultCode, error.message, error);
  }

  return new AppError(defaultCode, String(error));
}

/**
 * 統一錯誤處理函數
 */
export function handleError(error: unknown, context?: string): AppError {
  const appError = createAppError(error);
  
  // 記錄錯誤到 console
  console.error(`[Error${context ? ` in ${context}` : ''}] ${appError.getDebugInfo()}`);
  
  return appError;
}

/**
 * 錯誤處理包裝器（用於 async 函數）
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string,
  defaultCode: ErrorCode = ErrorCode.UNKNOWN
): Promise<{ success: true; data: T } | { success: false; error: AppError }> {
  return fn()
    .then((data) => ({ success: true as const, data }))
    .catch((error) => {
      const appError = handleError(error, context);
      return { success: false as const, error: appError };
    });
}

/**
 * 檢查是否為 AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * 取得錯誤的使用者友善訊息
 */
export function getUserErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.getUserMessage();
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return ERROR_MESSAGES[ErrorCode.UNKNOWN];
}