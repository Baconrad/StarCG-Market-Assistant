<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMarketStore } from './stores/market'

const store = useMarketStore()
const route = useRoute()
const isExtensionInstalled = ref(false)
const isChecking = ref(true)

// 從環境變數讀取擴充功能 ID
const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID || 'ooiofmpdcmcjclbbphgkfhcnebpomded'

onMounted(() => {
  store.loadMagicCrystalRatio()
  checkExtension().then(() => {
    // 擴充功能檢查完成後，嘗試同步追蹤資料
    store.syncTrackedItems()
  })
})

async function checkExtension() {
  try {
    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // @ts-ignore
      chrome.runtime.sendMessage(EXTENSION_ID, { type: 'CHECK_INSTALLED' }, (response: any) => {
        // 必須檢查 lastError 並「消耗」它，否則 Chrome 會顯示錯誤
        const lastError = chrome.runtime.lastError
        if (!lastError && response?.installed) {
          isExtensionInstalled.value = true
        }
        isChecking.value = false
      })
      // 設定超時
      setTimeout(() => {
        if (isChecking.value) {
          isChecking.value = false
        }
      }, 1000)
    } else {
      isChecking.value = false
    }
  } catch {
    isChecking.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-[#f3e7de] to-[#f8eee7]">
    <nav class="bg-[#e8d5c4] border-b border-[#d6b089] px-6 py-4">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-3">
          <img src="/logo.png" alt="星詠賣場助手" class="w-10 h-10 object-cover" />
          <h1 class="text-2xl font-bold text-[#8b4f2b]">星詠賣場助手</h1>
        </router-link>
        <div class="flex gap-2">
          <router-link
            to="/"
            class="px-4 py-2 rounded-md transition-colors"
            :class="route.path === '/' ? 'bg-[#d6b089] text-[#2b160e]' : 'text-[#2b160e] hover:bg-[#d6b089]'"
          >
            首頁
          </router-link>
          
          <!-- 未安裝時顯示禁用狀態 -->
          <template v-if="!isExtensionInstalled && !isChecking">
            <span
              class="px-4 py-2 rounded-md text-[#2b160e] opacity-50 cursor-not-allowed"
              title="請先安裝擴充功能"
            >
              賣場搜尋
            </span>
            <span
              class="px-4 py-2 rounded-md text-[#2b160e] opacity-50 cursor-not-allowed"
              title="請先安裝擴充功能"
            >
              追蹤清單 ({{ store.trackedItems.length }})
            </span>
          </template>
          
          <!-- 已安裝時顯示可點擊連結 -->
          <template v-else>
            <router-link
              to="/market"
              class="px-4 py-2 rounded-md transition-colors hover:bg-[#d6b089]"
              :class="route.path === '/market' ? 'bg-[#d6b089] text-[#2b160e]' : 'text-[#2b160e]'"
            >
              賣場搜尋
            </router-link>
            <router-link
              to="/tracked"
              class="px-4 py-2 rounded-md transition-colors hover:bg-[#d6b089]"
              :class="route.path === '/tracked' ? 'bg-[#d6b089] text-[#2b160e]' : 'text-[#2b160e]'"
            >
              追蹤清單 ({{ store.trackedItems.length }})
            </router-link>
          </template>
        </div>
      </div>
    </nav>
    <main class="p-6">
      <div class="max-w-6xl mx-auto">
        <router-view />
      </div>
    </main>
  </div>
</template>
