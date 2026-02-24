<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMarketStore } from '../stores/market'
import { fetchAllMarketPages } from '../utils/api'
import { buildRowsFromApi } from '../utils/columns'
import { ERROR_MESSAGES } from '../utils/constants'

// Components
import ShadCard from '../components/shadcn/Card.vue'
import ShadButton from '../components/shadcn/Button.vue'
import ShadInput from '../components/shadcn/Input.vue'
import MarketTable from '../components/MarketTable.vue'
import BountyDialog from '../components/BountyDialog.vue'

const store = useMarketStore()
const route = useRoute()
const q = ref('')
const nameFilter = ref('')
const showBountyDialog = ref(false)
// 本地魔晶比值，用於輸入控制
const localRatio = ref(store.magicCrystalRatio)

// 頁面載入時檢查 URL query 參數
onMounted(() => {
  const queryQ = route.query.q as string
  if (queryQ && queryQ.trim()) {
    q.value = queryQ.trim()
    doSearch()
  }
})

async function doSearch() {
  const text = q.value.trim()
  if (!text) {
    store.setRows([])
    return
  }

  store.setLoading(true)
  try {
    const apiData = await fetchAllMarketPages(text)
    const rows = buildRowsFromApi(apiData)
    store.setRows(rows)
    // 搜尋後自動填入商品名稱篩選
    nameFilter.value = text
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    alert(`${ERROR_MESSAGES.FETCH_FAILED}：${errorMsg}`)
  } finally {
    store.setLoading(false)
  }
}

function selectBountyItem(itemName: string) {
  q.value = itemName
  showBountyDialog.value = false
  doSearch()
}

// 當本地比值變化時，更新 store（使用 debounce）
let ratioTimeout: ReturnType<typeof setTimeout> | null = null
function onRatioChange(value: number) {
  localRatio.value = value
  if (ratioTimeout) clearTimeout(ratioTimeout)
  ratioTimeout = setTimeout(() => {
    store.setMagicCrystalRatio(value)
  }, 300)
}

// 同步 store 比值到本地
watch(() => store.magicCrystalRatio, (newVal) => {
  localRatio.value = newVal
})
</script>

<template>
  <div class="space-y-6">
    <!-- Search Section -->
    <ShadCard class="p-6">
      <div class="flex gap-3">
        <ShadInput
          v-model="q"
          placeholder="搜尋商品名稱或攤位…"
          class="flex-1"
          :disabled="store.loading"
          @keydown.enter="doSearch"
        />
        <ShadButton :disabled="store.loading" @click="doSearch">
          <span v-if="store.loading">搜尋中...</span>
          <span v-else>搜尋</span>
        </ShadButton>
      </div>
      <div class="mt-4">
        <ShadButton variant="outline" size="sm" @click="showBountyDialog = true">
          🎯 懸賞裝備及寵物
        </ShadButton>
      </div>
    </ShadCard>

    <!-- Filter Section -->
    <ShadCard class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- 商品名稱篩選 -->
        <div class="space-y-2">
          <label class="text-sm font-semibold text-[#3b2b22]">商品名稱篩選</label>
          <ShadInput v-model="nameFilter" placeholder="篩選商品名稱…" />
        </div>

        <!-- 商品類型 -->
        <div class="space-y-2">
          <label class="text-sm font-semibold text-[#3b2b22]">商品類型</label>
          <div class="flex flex-wrap gap-2">
            <ShadButton
              v-for="t in ['all', 'item', 'pet'] as const"
              :key="t"
              :variant="store.selectedType === t ? 'default' : 'outline'"
              size="sm"
              @click="store.selectedType = t"
            >
              {{ 
                t === 'all' 
                  ? `全部(${store.allRows.length})` 
                  : t === 'item' 
                    ? `僅道具(${store.typeCounts.item})` 
                    : `僅寵物(${store.typeCounts.pet})` 
              }}
            </ShadButton>
          </div>
        </div>

        <!-- 交易單位 -->
        <div class="space-y-2">
          <label class="text-sm font-semibold text-[#3b2b22]">交易單位</label>
          <div class="flex flex-wrap gap-2">
            <ShadButton
              v-for="p in ['all', '0', '1'] as const"
              :key="p"
              :variant="store.selectedPrice === p ? 'default' : 'outline'"
              size="sm"
              @click="store.selectedPrice = p"
            >
              {{ 
                p === 'all' 
                  ? `全部(${store.allRows.length})` 
                  : p === '0' 
                    ? `金幣(${store.priceCounts['0']})` 
                    : `魔晶(${store.priceCounts['1']})` 
              }}
            </ShadButton>
          </div>
        </div>

        <!-- 魔晶比值 -->
        <div class="space-y-2">
          <label class="text-sm font-semibold text-[#3b2b22]">魔晶比值</label>
          <div class="flex items-center gap-2">
            <ShadInput
              :model-value="localRatio"
              type="number"
              min="1"
              max="9999"
              class="w-24 text-center"
              @update:model-value="(v) => onRatioChange(Number(v))"
            />
          </div>
          <p class="text-xs text-[#8b4f2b]/60">魔晶商品將換算為金幣價格進行排序</p>
        </div>
      </div>
    </ShadCard>

    <!-- Results Table -->
    <MarketTable :name-filter="nameFilter" />

    <!-- Bounty Dialog -->
    <BountyDialog 
      v-model:open="showBountyDialog"
      @select="selectBountyItem"
    />
  </div>
</template>
