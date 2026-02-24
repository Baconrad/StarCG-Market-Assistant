<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMarketStore } from '../stores/market'
import { fetchMarketHistory } from '../utils/api'
import type { TrackedItem } from '../types/messages'

// Components
import ShadCard from '../components/shadcn/Card.vue'
import ShadButton from '../components/shadcn/Button.vue'
import ShadTable from '../components/shadcn/Table.vue'
import ShadTableHeader from '../components/shadcn/TableHeader.vue'
import ShadTableBody from '../components/shadcn/TableBody.vue'
import ShadTableRow from '../components/shadcn/TableRow.vue'
import ShadTableCell from '../components/shadcn/TableCell.vue'
import HistoryDialog from '../components/HistoryDialog.vue'

const store = useMarketStore()
const router = useRouter()
const updatingPrices = ref<Set<string>>(new Set())
const showHistoryDialog = ref(false)
const selectedHistoryItem = ref<TrackedItem | null>(null)

async function updateItemPrice(item: TrackedItem) {
  updatingPrices.value.add(item.name)
  try {
    const historyType = item.type === 'pet' ? 'pet' : 'item'
    const history = await fetchMarketHistory(item.name, historyType, 3)
    const { minPrice, avgPrice } = store.calculatePriceStats(history)
    
    const index = store.trackedItems.findIndex((i) => i.name === item.name)
    if (index !== -1) {
      store.updateTrackedItem(index, {
        minPrice,
        avgPrice,
        lastUpdated: Date.now(),
        historyData: history,
      })
    }
  } catch (error) {
    alert('更新價格失敗')
  } finally {
    updatingPrices.value.delete(item.name)
  }
}

async function updateAllPrices() {
  for (const item of store.trackedItems) {
    await updateItemPrice(item)
  }
}

function openHistoryDialog(item: TrackedItem) {
  selectedHistoryItem.value = item
  showHistoryDialog.value = true
}

function searchItem(name: string) {
  router.push({ path: '/market', query: { q: name } })
}

/**
 * 取得上次更新時間的顯示文字
 */
function getLastUpdatedText(lastUpdated: number | undefined): string {
  if (!lastUpdated) return '-'
  
  const now = Date.now()
  const diffMs = now - lastUpdated
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins <= 30) return '30 分鐘內'
  if (diffMins <= 24 * 60) return '1 ~ 24 小時內'
  return '超過 1 天'
}

/**
 * 取得上次更新時間的樣式類別
 */
function getLastUpdatedClass(lastUpdated: number | undefined): string {
  if (!lastUpdated) return 'text-[#8b4f2b]/40'
  
  const now = Date.now()
  const diffMs = now - lastUpdated
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins <= 30) return 'text-green-600'
  if (diffMins <= 24 * 60) return 'text-orange-500'
  return 'text-red-500'
}
</script>

<template>
  <ShadCard class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-[#8b4f2b]">我的追蹤清單</h2>
      <div class="flex gap-2">
        <ShadButton
          v-if="store.trackedItems.length > 0"
          variant="outline"
          size="sm"
          :disabled="updatingPrices.size > 0"
          @click="updateAllPrices"
        >
          {{ updatingPrices.size > 0 ? '更新中...' : '更新全部價格' }}
        </ShadButton>
      </div>
    </div>

    <div v-if="store.trackedItems.length === 0" class="text-center py-12">
      <p class="text-[#8b4f2b]/60">尚無追蹤項目</p>
      <p class="text-sm text-[#8b4f2b]/40 mt-2">在搜尋結果中點擊「追蹤」按鈕即可加入清單</p>
    </div>

    <div v-else>
      <ShadTable>
        <ShadTableHeader>
          <ShadTableRow>
            <ShadTableCell :is-header="true" class="text-center">類型</ShadTableCell>
            <ShadTableCell :is-header="true" class="text-center">名稱</ShadTableCell>
            <ShadTableCell :is-header="true" class="text-center">最低成交價</ShadTableCell>
            <ShadTableCell :is-header="true" class="text-center">平均成交價</ShadTableCell>
            <ShadTableCell :is-header="true" class="text-center">上次更新時間</ShadTableCell>
            <ShadTableCell :is-header="true" class="text-center">歷史成交明細</ShadTableCell>
            <ShadTableCell :is-header="true" class="text-center">功能</ShadTableCell>
          </ShadTableRow>
        </ShadTableHeader>
        <ShadTableBody>
          <ShadTableRow v-for="(item, index) in store.trackedItems" :key="index">
            <ShadTableCell class="text-center">
              <span
                class="px-2 py-1 rounded-full text-xs"
                :class="item.type === 'pet' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'"
              >
                {{ item.type === 'pet' ? '寵物' : '道具' }}
              </span>
            </ShadTableCell>
            <ShadTableCell class="text-center font-medium">{{ item.name }}</ShadTableCell>
            <ShadTableCell class="text-center">
              <span v-if="item.minPrice !== undefined">
                {{ new Intl.NumberFormat('en-US').format(item.minPrice) }}
              </span>
              <span v-else class="text-[#8b4f2b]/40">-</span>
            </ShadTableCell>
            <ShadTableCell class="text-center">
              <span v-if="item.avgPrice !== undefined">
                {{ new Intl.NumberFormat('en-US').format(item.avgPrice) }}
              </span>
              <span v-else class="text-[#8b4f2b]/40">-</span>
            </ShadTableCell>
            <ShadTableCell class="text-center">
              <span :class="getLastUpdatedClass(item.lastUpdated)">
                {{ getLastUpdatedText(item.lastUpdated) }}
              </span>
            </ShadTableCell>
            <ShadTableCell class="text-center">
              <ShadButton
                variant="outline"
                size="sm"
                :disabled="!item.historyData?.length"
                @click="openHistoryDialog(item)"
              >
                查看({{ item.historyData?.length || 0 }})
              </ShadButton>
            </ShadTableCell>
            <ShadTableCell class="text-center">
              <div class="flex justify-center gap-2">
                <ShadButton
                  variant="outline"
                  size="sm"
                  :disabled="updatingPrices.has(item.name)"
                  @click="updateItemPrice(item)"
                >
                  {{ updatingPrices.has(item.name) ? '更新中' : '更新成交價' }}
                </ShadButton>
                <ShadButton
                  variant="outline"
                  size="sm"
                  @click="searchItem(item.name)"
                >
                  搜尋
                </ShadButton>
                <ShadButton
                  variant="ghost"
                  size="sm"
                  class="text-red-500"
                  @click="store.removeTracked(index)"
                >
                  刪除
                </ShadButton>
              </div>
            </ShadTableCell>
          </ShadTableRow>
        </ShadTableBody>
      </ShadTable>
    </div>
  </ShadCard>

  <HistoryDialog
    v-model:open="showHistoryDialog"
    :item="selectedHistoryItem"
  />
</template>
