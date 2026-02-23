<script setup lang="ts">
import { useMarketStore } from '../stores/market'
import type { TrackedItem } from '../types/messages'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './shadcn/ui/dialog'
import ShadTable from './shadcn/Table.vue'
import ShadTableHeader from './shadcn/TableHeader.vue'
import ShadTableBody from './shadcn/TableBody.vue'
import ShadTableRow from './shadcn/TableRow.vue'
import ShadTableCell from './shadcn/TableCell.vue'

const props = defineProps<{
  open: boolean
  item: TrackedItem | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const store = useMarketStore()
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="w-[75%] min-w-[600px] max-w-4xl max-h-[80vh] overflow-y-auto bg-[#f8eee7] border-[#d6b089]">
      <DialogHeader>
        <DialogTitle class="text-[#8b4f2b]">
          {{ item?.name }} - 歷史成交明細
        </DialogTitle>
      </DialogHeader>
      <div v-if="item?.historyData?.length">
        <ShadTable>
          <ShadTableHeader>
            <ShadTableRow>
              <ShadTableCell :is-header="true" class="text-center">時間</ShadTableCell>
              <ShadTableCell :is-header="true" class="text-center">價格</ShadTableCell>
              <ShadTableCell :is-header="true" class="text-center">單位</ShadTableCell>
              <ShadTableCell :is-header="true" class="text-center">換算金幣價</ShadTableCell>
              <ShadTableCell :is-header="true" class="text-center">購買者</ShadTableCell>
            </ShadTableRow>
          </ShadTableHeader>
          <ShadTableBody>
            <ShadTableRow v-for="(record, idx) in item.historyData" :key="idx">
              <ShadTableCell class="text-center">{{ record.timeText }}</ShadTableCell>
              <ShadTableCell class="text-center">
                {{ new Intl.NumberFormat('en-US').format(record.price) }}
              </ShadTableCell>
              <ShadTableCell class="text-center">
                <span
                  class="px-2 py-0.5 rounded-full text-xs"
                  :class="record.priceType === '1' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'"
                >
                  {{ record.priceType === '1' ? '魔晶' : '金幣' }}
                </span>
              </ShadTableCell>
              <ShadTableCell class="text-center">
                {{ new Intl.NumberFormat('en-US').format(
                  record.priceType === '1' ? record.price * store.magicCrystalRatio : record.price
                ) }}
              </ShadTableCell>
              <ShadTableCell class="text-center">{{ record.buyerName }}</ShadTableCell>
            </ShadTableRow>
          </ShadTableBody>
        </ShadTable>
        <div class="mt-4 text-sm text-[#8b4f2b]/70">
          <p>魔晶比值: {{ store.magicCrystalRatio }}</p>
          <p>共 {{ item.historyData.length }} 筆成交記錄</p>
        </div>
      </div>
      <div v-else class="text-center py-12 text-[#8b4f2b]/60">
        無歷史成交資料
      </div>
    </DialogContent>
  </Dialog>
</template>
