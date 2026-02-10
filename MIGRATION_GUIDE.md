# 重構後代碼結構指南

## 目錄結構

```
.
├── types/                      # 類型定義（新增）
│   ├── messages.ts            # 消息系統類型
│   ├── storage.ts             # 存儲類型
│   └── market.ts              # 市場相關類型
│
├── utils/                      # 工具和服務層（新增）
│   ├── messaging.ts           # 統一消息系統
│   ├── storage.ts             # 統一存儲訪問
│   ├── api.ts                 # API 服務層
│   └── constants.ts           # 配置常量
│
├── entrypoints/               # 入口點（重構）
│   ├── background.ts          # Service worker（簡化）
│   ├── content.ts             # Content script
│   ├── popup/
│   │   └── App.vue            # 彈窗 UI（簡化）
│   └── market/
│       ├── App.vue            # 市場頁面（簡化）
│       └── columns.ts         # 表格定義（優化）
│
├── components/                # Vue 組件
├── assets/                    # 靜態資源
└── ...                        # 其他配置文件
```

## 快速開始

### 發送消息到 Background Service Worker

**舊方式**：
```typescript
// popup/App.vue 中
if (browser?.runtime?.sendMessage) {
  const res = await browser.runtime.sendMessage(msg);
} else if (chrome?.runtime?.sendMessage) {
  const res = await new Promise(resolve => 
    chrome.runtime.sendMessage(msg, resolve)
  );
}
```

**新方式**：
```typescript
import { sendMessage } from '@/utils/messaging';
import type { FetchMarketResponse } from '@/types/messages';

const res = await sendMessage<FetchMarketResponse>({
  type: 'fetchMarket',
  search: 'sword'
});
```

### 訪問存儲

**舊方式**：
```typescript
// 重複檢查邏輯
if (browser?.storage?.local) {
  const res = await browser.storage.local.get('trackedItems');
  items.value = res?.trackedItems ?? [];
} else if (chrome?.storage?.local) {
  await new Promise(resolve => {
    chrome.storage.local.get('trackedItems', res => {
      items.value = res?.trackedItems ?? [];
      resolve();
    });
  });
}
```

**新方式**：
```typescript
import { getStorage, setStorage } from '@/utils/storage';
import type { TrackedItem } from '@/types/messages';

// 獲取
const items = await getStorage('trackedItems');
// 返回類型自動推導為 TrackedItem[] | undefined

// 設置
await setStorage('trackedItems', newItems);
```

### 添加新的消息類型

1. **在 `types/messages.ts` 中定義類型**：
```typescript
export interface GetTrackedItemsMessage extends Message {
  type: 'getTrackedItems';
}

export interface GetTrackedItemsResponse {
  success: boolean;
  items?: TrackedItem[];
  message?: string;
}

export type AnyMessage =
  | FetchMarketMessage
  | AddTrackedMessage
  | GetTrackedItemsMessage; // 新增
```

2. **在 `entrypoints/background.ts` 中添加 handler**：
```typescript
async function handleGetTrackedItems(): Promise<GetTrackedItemsResponse> {
  try {
    const items = await getStorage('trackedItems');
    return { success: true, items };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

// 在消息路由中添加
switch (message.type) {
  case 'getTrackedItems':
    return await handleGetTrackedItems();
}
```

3. **在 UI 中使用**：
```typescript
import { sendMessage } from '@/utils/messaging';

const response = await sendMessage<GetTrackedItemsResponse>({
  type: 'getTrackedItems'
});
```

### 添加新的 API 端點

1. **在 `utils/api.ts` 中添加函數**：
```typescript
export async function fetchUserStalls(): Promise<UserStall[]> {
  const url = `${API_CONFIG.BASE_URL}/api/stalls`;
  const response = await fetch(url);
  return await response.json();
}
```

2. **在 background handler 中使用**：
```typescript
async function handleGetUserStalls() {
  try {
    const stalls = await fetchUserStalls();
    return { success: true, stalls };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}
```

## 常見問題

### Q: 為什麼需要類型定義？
A: 類型定義提供編譯時檢查，幫助捕獲錯誤。例如：
```typescript
// 類型檢查會立即報錯
const res = await sendMessage<FetchMarketResponse>({
  type: 'FetchMarket', // ❌ TypeScript 錯誤：應該是 'fetchMarket'
  search: 'sword'
});
```

### Q: 哪些情況下該添加到 `types/` vs `utils/`？
- **types/**：數據結構、接口、類型別名
- **utils/**：函數、工具、邏輯

### Q: 如何添加新的配置項？
在 `utils/constants.ts` 中添加到合適的對象：
```typescript
export const MARKET_CONFIG = {
  DEFAULT_MAGIC_CRYSTAL_RATIO: 175,
  DEFAULT_PAGE_SIZE: 100,  // ← 添加到這裡
  TIMEOUT_MS: 30000,
} as const;
```

### Q: 舊代碼能否繼續工作？
是的，但建議使用新的 utils：
- `popup/App.vue` 已經全部轉換
- `market/App.vue` 已經全部轉換
- 舊的 `any` 類型代碼可以逐步替換

### Q: 如何測試新代碼？
```bash
# 類型檢查
pnpm compile

# 開發構建
pnpm dev

# 生產構建
pnpm build

# 打包為 zip
pnpm zip
```

## 更多資源

- [WXT 文檔](https://wxt.dev/)
- [Vue 3 文檔](https://vuejs.org/)
- [TypeScript 文檔](https://www.typescriptlang.org/)
- [TanStack Vue Table 文檔](https://tanstack.com/table/v8/docs/guide/introduction)

## 支持

如有疑問，請參考 `REFACTOR_REPORT.md` 獲取詳細信息。
