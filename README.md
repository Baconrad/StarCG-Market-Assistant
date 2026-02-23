# StarCG Market Extension

星詠魔力賣場搜尋工具 - Monorepo 架構

## 專案結構

```
.
├── extension/          # Chrome 擴充功能 (WXT)
├── web/               # 網頁應用 (Vue + Vite)
└── shared/            # 共用資源 (可選)
```

## 開發說明

### Extension (擴充功能)

```bash
cd extension
pnpm install
pnpm dev
```

### Web (網頁應用)

```bash
cd web
pnpm install
pnpm dev
```

### 部署到 GitHub Pages

```bash
cd web
pnpm build
pnpm deploy
```

## 功能特性

- 🔍 賣場商品搜尋
- 📊 價格排序與篩選
- 🎯 懸賞裝備快速查詢
- 📈 歷史成交價格追蹤
- 💎 魔晶比值換算

## 技術棧

- **Extension**: WXT + Vue 3 + TypeScript
- **Web**: Vue 3 + Vite + TypeScript + Pinia + Vue Router
- **UI**: Tailwind CSS + shadcn-vue
- **Table**: TanStack Table

## License

MIT
