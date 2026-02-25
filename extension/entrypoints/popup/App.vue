<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getStorage } from '@/utils/storage'
import type { TrackedItem } from '@/types/messages'
import ShadButton from '@/components/shadcn/Button.vue'

const WEB_URL = 'https://baconrad.github.io/StarCG-Market-Assistant/'
const trackedItems = ref<TrackedItem[]>([])
const loading = ref(true)

// 依 lastUpdated 降序排列（最近更新的在前面）
const sortedItems = computed(() => {
  return [...trackedItems.value].sort((a, b) => {
    return (b.lastUpdated || 0) - (a.lastUpdated || 0)
  })
})

// 顯示最近更新的 5 筆
const displayItems = computed(() => {
  return sortedItems.value.slice(0, 5)
})

onMounted(async () => {
  try {
    const items = await getStorage('trackedItems')
    trackedItems.value = items || []
  } catch (error) {
    console.error('載入追蹤清單失敗:', error)
  } finally {
    loading.value = false
  }
})

function openWebApp(path: string = 'market') {
  window.open(`${WEB_URL}#/${path}`, '_blank')
}

function searchItem(name: string) {
  window.open(`${WEB_URL}#/market?q=${encodeURIComponent(name)}`, '_blank')
}

function formatPrice(price: number | undefined) {
  if (price === undefined) return '-'
  return new Intl.NumberFormat('en-US').format(price)
}
</script>

<template>
  <div class="w-[360px] min-h-[480px] bg-bg-base flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-[#e8d5c4] px-4 py-3 border-b border-[#d6b089] shrink-0">
      <div class="flex items-center gap-3">
        <img src="/logo.png" alt="星詠賣場助手" class="w-10 h-10 rounded-full object-cover" />
        <h1 class="text-xl font-bold text-[#8b4f2b]">星詠賣場助手</h1>
      </div>
    </header>

    <!-- 主要內容區域 -->
    <main class="flex-1 flex flex-col p-4 gap-4">
      <!-- 前往賣場按鈕 -->
      <ShadButton size="lg" class="w-full" @click="openWebApp('market')">
        <span class="flex items-center justify-center gap-2">
          <span>🛍️</span>
          <span>前往賣場搜尋</span>
        </span>
      </ShadButton>

      <!-- 追蹤清單區塊 -->
      <section class="flex-1 flex flex-col min-h-0">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-bold text-text-dark flex items-center gap-2">
            <span>📋</span>
            <span>我的追蹤清單</span>
            <span v-if="trackedItems.length > 0" class="text-xs font-normal text-text-muted">
              ({{ trackedItems.length }})
            </span>
          </h2>
          <button
            v-if="trackedItems.length > 0"
            @click="openWebApp('tracked')"
            class="text-xs text-primary hover:text-primary-dark transition-colors font-medium"
          >
            查看全部 →
          </button>
        </div>

        <!-- 載入中 -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <div class="flex flex-col items-center gap-3 text-text-muted">
            <div class="w-8 h-8 border-3 border-border-light border-t-primary rounded-full animate-spin"></div>
            <span class="text-sm">載入中...</span>
          </div>
        </div>

        <!-- 無追蹤項目 -->
        <div v-else-if="trackedItems.length === 0" class="flex-1 flex flex-col items-center justify-center py-8">
          <div class="text-5xl mb-3">📭</div>
          <p class="text-text-muted font-medium">尚無追蹤項目</p>
          <p class="text-xs text-text-muted/70 mt-2 text-center">
            在賣場搜尋中點擊「追蹤」按鈕<br/>即可加入清單
          </p>
        </div>

        <!-- 追蹤清單列表 -->
        <div v-else class="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1 scrollbar-thin">
          <div
            v-for="item in displayItems"
            :key="item.name"
            class="bg-bg-light rounded-lg p-3 border border-border-light hover:border-primary transition-colors"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span
                    class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                    :class="item.type === 'pet' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'"
                  >
                    {{ item.type === 'pet' ? '寵物' : '道具' }}
                  </span>
                  <span class="text-sm font-medium text-text-dark truncate">{{ item.name }}</span>
                </div>
                <div class="text-xs text-text-muted flex items-center gap-1">
                  <template v-if="item.minPrice !== undefined">
                    <span class="text-primary">💰</span>
                    <span>最低: {{ formatPrice(item.minPrice) }}</span>
                  </template>
                  <template v-else-if="item.avgPrice !== undefined">
                    <span class="text-primary">📊</span>
                    <span>均價: {{ formatPrice(item.avgPrice) }}</span>
                  </template>
                  <template v-else>
                    <span class="text-text-muted/50">尚未更新價格</span>
                  </template>
                </div>
              </div>
              <ShadButton variant="outline" size="sm" @click="searchItem(item.name)">
                搜尋
              </ShadButton>
            </div>
          </div>

          <!-- 超過 5 個的提示 -->
          <div v-if="trackedItems.length > 5" class="text-center py-2">
            <span class="text-xs text-text-muted">
              還有 {{ trackedItems.length - 5 }} 個項目...
            </span>
            <button
              @click="openWebApp('tracked')"
              class="text-xs text-primary hover:text-primary-dark ml-1 font-medium"
            >
              查看全部
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
/* 自訂卷軸樣式 */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #d6b089;
  border-radius: 2px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #c99b71;
}

/* 載入動畫 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 邊框寬度 */
.border-3 {
  border-width: 3px;
}
</style>