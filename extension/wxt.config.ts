import { defineConfig } from 'wxt';
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),  
  manifest: ({ mode }) => ({
    name: '星詠賣場助手',
    short_name: 'Star Trade Assistant',
    version: '1.0',
    version_name: '1.0 beta',
    description: '星詠賣場助手 - 快速搜尋商品、追蹤價格、自動比直換算、查看攤位位置',
    host_permissions: ['*://*.starcg.net/*'],
    permissions: ['storage', 'activeTab'],
    externally_connectable: {
      matches: [
        'https://baconrad.github.io/StarCG-Market-Extension/*',
        'http://localhost:*/*',
      ],
      accepts_tls_channel_id: false,
    },
  }),
});
