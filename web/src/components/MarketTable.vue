<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useVueTable,
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/vue-table'
import { useMarketStore } from '../stores/market'
import { columns } from './marketColumns'
import ShadCard from './shadcn/Card.vue'
import ShadTable from './shadcn/Table.vue'
import ShadTableHeader from './shadcn/TableHeader.vue'
import ShadTableBody from './shadcn/TableBody.vue'
import ShadTableRow from './shadcn/TableRow.vue'
import ShadTableCell from './shadcn/TableCell.vue'
import MapViewer from './MapViewer.vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './shadcn/ui/dialog'

const props = defineProps<{
  nameFilter: string
}>()

const store = useMarketStore()
const sorting = ref<SortingState>([{ id: 'sortablePrice', desc: false }])

// 地圖對話框狀態
const showMapDialog = ref(false)
const mapDialogX = ref(0)
const mapDialogY = ref(0)

const filteredData = computed(() => {
  let data = store.filteredData
  const query = props.nameFilter.trim().toLowerCase()
  if (query) {
    data = data.filter((item) => {
      const name = String(item.name || '').toLowerCase()
      return name.includes(query)
    })
  }
  return data
})

function handleShowMap(x: number, y: number) {
  mapDialogX.value = x
  mapDialogY.value = y
  showMapDialog.value = true
}

function handleTrack(row: any) {
  const isTracked = store.trackedItems.some(item => item.name === row.name)
  
  if (isTracked) {
    // 取消追蹤
    store.removeTrackedByName(row.name)
  } else {
    // 添加追蹤
    store.addTracked({
      name: row.name,
      type: row.type,
      addedAt: Date.now(),
    })
  }
}

function handleRemoveTrack(name: string) {
  store.removeTrackedByName(name)
}

const table = useVueTable({
  get data() {
    return filteredData.value
  },
  columns: columns(
    handleTrack,
    handleRemoveTrack,
    store.trackedItems,
    handleShowMap
  ),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  state: {
    get sorting() {
      return sorting.value
    },
  },
})
</script>

<template>
  <ShadCard class="overflow-hidden">
    <ShadTable>
      <ShadTableHeader>
        <ShadTableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <ShadTableCell
            v-for="header in headerGroup.headers"
            :key="header.id"
            :is-header="true"
          >
            <FlexRender
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </ShadTableCell>
        </ShadTableRow>
      </ShadTableHeader>
      <ShadTableBody>
        <template v-if="table.getRowModel().rows?.length">
          <ShadTableRow v-for="row in table.getRowModel().rows" :key="row.id">
            <ShadTableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </ShadTableCell>
          </ShadTableRow>
        </template>
        <ShadTableRow v-else>
          <ShadTableCell
            :colspan="table.getHeaderGroups()[0]?.headers.length || 1"
            class="h-96 text-center"
          >
            <div v-if="store.loading" class="flex h-full items-center justify-center">
              載入中…
            </div>
            <div v-else class="text-[#8b4f2b]/60">
              沒有結果
            </div>
          </ShadTableCell>
        </ShadTableRow>
      </ShadTableBody>
    </ShadTable>
  </ShadCard>

  <!-- 地圖對話框 -->
  <Dialog v-model:open="showMapDialog">
    <DialogContent class="max-w-3xl bg-[#f8eee7] border-[#d6b089]">
      <DialogHeader>
        <DialogTitle class="text-[#8b4f2b]">攤位位置 (X: {{ mapDialogX }}, Y: {{ mapDialogY }})</DialogTitle>
      </DialogHeader>
      <div class="max-h-[70vh] overflow-auto">
        <MapViewer :x="mapDialogX" :y="mapDialogY" />
      </div>
    </DialogContent>
  </Dialog>
</template>

