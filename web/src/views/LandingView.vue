<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ShadCard from '../components/shadcn/Card.vue'
import ShadButton from '../components/shadcn/Button.vue'
import { checkExtensionInstalled as checkExtension, PROD_EXTENSION_ID } from '../utils/extension'

const router = useRouter()
const isExtensionInstalled = ref(false)
const isChecking = ref(true)

onMounted(async () => {
  const result = await checkExtension()
  isExtensionInstalled.value = result.installed
  isChecking.value = false
})

function openChromeStore() {
  // Chrome Web Store 連結
  window.open(`https://chrome.google.com/webstore/detail/${PROD_EXTENSION_ID}`, '_blank')
}

function enterMarket() {
  router.push('/market')
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Hero Section -->
    <div class="text-center py-12">
      <img src="/logo.png" alt="星詠賣場助手" class="w-20 h-20 object-cover mx-auto mb-6" />
      <h1 class="text-4xl font-bold text-[#8b4f2b] mb-4">星詠賣場助手</h1>
      <p class="text-xl text-[#3b2b22] mb-8">StarCG Trade Assistant - 專為星詠玩家打造的賣場搜尋工具</p>
      
      <!-- Loading -->
      <div v-if="isChecking" class="text-[#8b4f2b]/60 mb-8">
        正在檢查擴充功能狀態...
      </div>

      <!-- 未安裝：顯示安裝按鈕 -->
      <div v-else-if="!isExtensionInstalled" class="mb-8">
        <ShadButton 
          size="lg" 
          class="bg-[#8b4f2b] hover:bg-[#6d3f22] text-white px-8 py-4 text-lg cursor-pointer"
          @click="openChromeStore"
        >
          🚀 安裝 Chrome 擴充功能
        </ShadButton>
        <p class="text-sm text-[#8b4f2b]/60 mt-3">
          安裝擴充功能後即可使用完整功能
        </p>
      </div>

      <!-- 已安裝：顯示進入賣場按鈕 -->
      <div v-else class="mb-8">
        <ShadButton 
          size="lg" 
          class="bg-[#8b4f2b] hover:bg-[#6d3f22] text-white px-8 py-4 text-lg cursor-pointer"
          @click="enterMarket"
        >
          🛍️ 進入賣場
        </ShadButton>
        <p class="text-sm text-[#8b4f2b]/60 mt-3">
          已偵測到擴充功能，點擊上方按鈕開始使用
        </p>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <ShadCard class="p-6">
        <div class="text-3xl mb-4">🔍</div>
        <h3 class="text-lg font-bold text-[#8b4f2b] mb-2">快速搜尋</h3>
        <p class="text-[#3b2b22]">支援關鍵字搜尋商品名稱，快速找到想要的物品</p>
      </ShadCard>
      
      <ShadCard class="p-6">
        <div class="text-3xl mb-4">📊</div>
        <h3 class="text-lg font-bold text-[#8b4f2b] mb-2">價格排序</h3>
        <p class="text-[#3b2b22]">依價格排序，輕鬆找到最優惠的商品</p>
      </ShadCard>
      
      <ShadCard class="p-6">
        <div class="text-3xl mb-4">🎯</div>
        <h3 class="text-lg font-bold text-[#8b4f2b] mb-2">懸賞裝備</h3>
        <p class="text-[#3b2b22]">內建懸賞裝備和寵物列表，一鍵快速查詢</p>
      </ShadCard>
      
      <ShadCard class="p-6">
        <div class="text-3xl mb-4">📈</div>
        <h3 class="text-lg font-bold text-[#8b4f2b] mb-2">價格追蹤</h3>
        <p class="text-[#3b2b22]">追蹤商品歷史成交價格，掌握市場趨勢</p>
      </ShadCard>
      
      <ShadCard class="p-6">
        <div class="text-3xl mb-4">💎</div>
        <h3 class="text-lg font-bold text-[#8b4f2b] mb-2">魔晶換算</h3>
        <p class="text-[#3b2b22]">自訂魔晶比值，自動換算金幣價格</p>
      </ShadCard>
      
      <ShadCard class="p-6">
        <div class="text-3xl mb-4">🗺️</div>
        <h3 class="text-lg font-bold text-[#8b4f2b] mb-2">攤位位置</h3>
        <p class="text-[#3b2b22]">顯示攤位地圖位置，快速找到賣家</p>
      </ShadCard>
    </div>

    <!-- How to Use -->
    <ShadCard class="p-8 mb-12">
      <h2 class="text-2xl font-bold text-[#8b4f2b] mb-6 text-center">使用說明</h2>
      <div class="space-y-4 text-[#3b2b22]">
        <div class="flex items-center gap-4">
          <span class="w-8 h-8 bg-[#8b4f2b] text-white rounded-full flex items-center justify-center flex-shrink-0">1</span>
          <p>安裝 Chrome 擴充功能</p>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-8 h-8 bg-[#8b4f2b] text-white rounded-full flex items-center justify-center flex-shrink-0">2</span>
          <p>點擊擴充功能圖示或開啟賣場搜尋頁面</p>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-8 h-8 bg-[#8b4f2b] text-white rounded-full flex items-center justify-center flex-shrink-0">3</span>
          <p>輸入商品名稱搜尋，使用篩選功能找到商品</p>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-8 h-8 bg-[#8b4f2b] text-white rounded-full flex items-center justify-center flex-shrink-0">4</span>
          <p>追蹤商品價格，查看歷史成交記錄</p>
        </div>
      </div>
    </ShadCard>

    <!-- Footer -->
    <div class="text-center text-sm text-[#8b4f2b]/60 pb-8">
      <p>此工具僅供學術研究或數據統計使用，與遊戲原廠無關。</p>
      <p class="mt-2">版本: 1.0 beta</p>
    </div>
  </div>
</template>
