/**
 * Extension 通訊模組
 * 
 * 優先順序：
 * 1. 正式版 Extension ID: ooiofmpdcmcjclbbphgkfhcnebpomded
 * 2. 本地測試版 Extension ID: inbfnpljohdfcloccnadimhpnkjfdibk
 * 3. localStorage 備份
 */

// Extension IDs
const PROD_EXTENSION_ID = 'ooiofmpdcmcjclbbphgkfhcnebpomded'
const DEV_EXTENSION_ID = 'inbfnpljohdfcloccnadimhpnkjfdibk'

// 從環境變數讀取（如果有的話）
const ENV_EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID

// 快取已連線的 Extension ID
let cachedExtensionId: string | null = null

/**
 * 檢查 Chrome 環境是否可用
 */
function isChromeEnvironment(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime
}

/**
 * 發送訊息到 Extension
 */
function sendMessageToExtension<T>(
  extensionId: string,
  message: any
): Promise<T | null> {
  return new Promise((resolve) => {
    if (!isChromeEnvironment()) {
      resolve(null)
      return
    }

    chrome.runtime.sendMessage(extensionId, message, (response) => {
      // 消耗 lastError
      const lastError = chrome.runtime.lastError
      if (lastError || !response) {
        resolve(null)
      } else {
        resolve(response)
      }
    })
  })
}

/**
 * 偵測可用的 Extension ID
 * 會依序嘗試正式版、環境變數、本地測試版
 */
export async function detectExtensionId(): Promise<string | null> {
  // 如果已經快取過，直接返回
  if (cachedExtensionId) {
    return cachedExtensionId
  }

  if (!isChromeEnvironment()) {
    return null
  }

  // 嘗試順序
  const idsToTry = [
    ENV_EXTENSION_ID,  // 環境變數優先
    PROD_EXTENSION_ID, // 正式版
    DEV_EXTENSION_ID,  // 本地測試版
  ].filter(Boolean) as string[]

  for (const id of idsToTry) {
    const response = await sendMessageToExtension<{ installed?: boolean }>(
      id,
      { type: 'CHECK_INSTALLED' }
    )
    
    if (response?.installed) {
      cachedExtensionId = id
      console.log(`[Extension] Connected to: ${id}`)
      return id
    }
  }

  return null
}

/**
 * 檢查 Extension 是否已安裝
 */
export async function checkExtensionInstalled(): Promise<{ installed: boolean; extensionId: string | null }> {
  const extensionId = await detectExtensionId()
  return {
    installed: !!extensionId,
    extensionId
  }
}

/**
 * 發送訊息到已偵測到的 Extension
 */
export async function sendExtensionMessage<T>(message: any): Promise<T | null> {
  const extensionId = await detectExtensionId()
  
  if (!extensionId) {
    return null
  }

  return sendMessageToExtension<T>(extensionId, message)
}

/**
 * 清除快取（用於測試或重新偵測）
 */
export function clearExtensionCache(): void {
  cachedExtensionId = null
}

// 匯出 ID 常數供其他地方使用
export { PROD_EXTENSION_ID, DEV_EXTENSION_ID }