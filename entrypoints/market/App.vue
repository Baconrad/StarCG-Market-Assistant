<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import {
  useVueTable,
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/vue-table';
import { columns, buildRowsFromApi } from './columns';
import { sendMessage } from '@/utils/messaging';
import { MARKET_CONFIG, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/utils/constants';
import type { Payment, ItemType, PriceType } from '@/types/market';
import type { FetchMarketResponse, TrackedItem } from '@/types/messages';
import '@/assets/tailwind.css';
import ShadButton from '@/components/shadcn/Button.vue';
import ShadInput from '@/components/shadcn/Input.vue';
import ShadCard from '@/components/shadcn/Card.vue';
import noResultsImg from '@/assets/no_results.png';
import ShadTable from '@/components/shadcn/Table.vue';
import ShadTableHeader from '@/components/shadcn/TableHeader.vue';
import ShadTableBody from '@/components/shadcn/TableBody.vue';
import ShadTableRow from '@/components/shadcn/TableRow.vue';
import ShadTableCell from '@/components/shadcn/TableCell.vue';

const q = ref('');
const nameFilter = ref('');
const allRows = ref<Payment[]>([]);
const loading = ref(false);
const selectedType = ref<ItemType | 'all'>('all');
const selectedPrice = ref<PriceType | 'all'>('all');
const magicCrystalRatio = ref(MARKET_CONFIG.DEFAULT_MAGIC_CRYSTAL_RATIO);
const sorting = ref<SortingState>([{ id: 'sortablePrice', desc: false }]);

/**
 * 計算過濾和排序後的數據
 */
const data = computed(() => {
  const source = allRows.value || [];
  let result = source.map((row) => ({
    ...row,
    sortablePrice:
      row.priceType === '1' ? row.price * (magicCrystalRatio.value || 1) : row.price,
  }));

  // 按類型過濾
  if (selectedType.value !== 'all') {
    result = result.filter((item) => item.type === selectedType.value);
  }

  // 按價格單位過濾
  if (selectedPrice.value !== 'all') {
    result = result.filter((item) => item.priceType === selectedPrice.value);
  }

  // 按名稱過濾
  const nameQuery = nameFilter.value.trim().toLowerCase();
  if (nameQuery) {
    result = result.filter((item) => {
      const name = String(item.name || '').toLowerCase();
      const stall = String(item.stallName || '').toLowerCase();
      const server = String(item.server || '').toLowerCase();
      return name.includes(nameQuery) || stall.includes(nameQuery) || server.includes(nameQuery);
    });
  }

  return result;
});

/**
 * 初始化表格
 */
const table = useVueTable({
  get data() {
    return data.value;
  },
  get columns() {
    return columns(addTracked);
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: (updaterOrValue) => {
    console.log('Sorting changed:', updaterOrValue);
    sorting.value =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(sorting.value)
        : updaterOrValue;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
  },
});

/**
 * 執行搜尋
 */
async function doSearch() {
  const text = q.value.trim();
  if (!text) {
    allRows.value = [];
    return;
  }

  loading.value = true;
  try {
    const apiData = await sendMessage<FetchMarketResponse>({
      type: 'fetchMarket',
      search: text,
    });

    if (!apiData) {
      throw new Error(ERROR_MESSAGES.NO_RESULTS);
    }

    if (apiData.success === false) {
      throw new Error(apiData.message || ERROR_MESSAGES.FETCH_FAILED);
    }

    // 所有字段都提供默認值以確保類型兼容性
    allRows.value = buildRowsFromApi({
      stalls: apiData.stalls || [],
      itemsByCd: apiData.itemsByCd || {},
      petsByCd: apiData.petsByCd || {},
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Search error:', errorMsg);
    alert(`${ERROR_MESSAGES.FETCH_FAILED}：${errorMsg}`);
  } finally {
    loading.value = false;
  }
}

/**
 * 添加項目到追蹤列表
 */
async function addTracked(row: Payment) {
  const item: TrackedItem = {
    name: row.name,
    price: row.price,
    stall: `${row.server} ${row.stallName} [${row.coords}]`,
    priceType: row.priceType,
    addedAt: Date.now(),
  };

  try {
    const res = await sendMessage({
      type: 'addTracked',
      item,
    });

    if (res?.success) {
      alert(SUCCESS_MESSAGES.ITEM_TRACKED);
    } else {
      alert(`${ERROR_MESSAGES.ADD_TRACKED_FAILED}：${res?.message || ''}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    alert(`${ERROR_MESSAGES.ADD_TRACKED_FAILED}：${errorMsg}`);
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-[#f3e7de] to-[#f8eee7] p-6">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-[#8b4f2b]">星詠魔力 賣場搜尋</h1>
      </div>

      <!-- Search Section -->
      <ShadCard class="p-6">
        <div class="flex gap-3">
          <ShadInput
            v-model="q"
            placeholder="搜尋商品名稱或攤位…"
            class="flex-1"
            :disabled="loading"
            @keydown.enter="doSearch"
          />
          <ShadButton :disabled="loading" @click="doSearch">
            <span v-if="loading">搜尋中...</span>
            <span v-else>搜尋</span>
          </ShadButton>
        </div>
      </ShadCard>

      <!-- Filter Section -->
      <ShadCard class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <!-- Name Filter -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-[#3b2b22]">名稱篩選</label>
            <ShadInput v-model="nameFilter" placeholder="篩選名稱、攤位、伺服器…" />
          </div>

          <!-- Type Filter -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-[#3b2b22]">商品類型</label>
            <div class="flex flex-wrap gap-2">
              <ShadButton
                v-for="t in ['all', 'item', 'pet'] as const"
                :key="t"
                :variant="selectedType === t ? 'default' : 'outline'"
                size="sm"
                @click="selectedType = t as any"
              >
                {{ t === 'all' ? '全部' : t === 'item' ? '僅道具' : '僅寵物' }}
              </ShadButton>
            </div>
          </div>

          <!-- Price Filter -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-[#3b2b22]">交易單位</label>
            <div class="flex flex-wrap gap-2">
              <ShadButton
                v-for="p in ['all', '0', '1'] as const"
                :key="p"
                :variant="selectedPrice === p ? 'default' : 'outline'"
                size="sm"
                @click="selectedPrice = p as any"
              >
                {{ p === 'all' ? '全部' : p === '0' ? '金幣' : '魔晶' }}
              </ShadButton>
            </div>
          </div>

          <!-- Magic Crystal Ratio -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-[#3b2b22]">魔晶比值</label>
            <ShadInput v-model.number="magicCrystalRatio" type="number" placeholder="e.g., 175" />
          </div>
        </div>
      </ShadCard>

      <!-- Results Table -->
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
                :colspan="table.getHeaderGroups()[0].headers.length"
                class="h-96"
              >
                <div v-if="loading" class="flex h-full w-full items-center justify-center">
                  載入中…
                </div>
                <div v-else class="flex h-full w-full items-center justify-center">
                  <img :src="noResultsImg" alt="沒有結果" />
                  沒有結果
                </div>
              </ShadTableCell>
            </ShadTableRow>
          </ShadTableBody>
        </ShadTable>
      </ShadCard>
    </div>
  </div>
</template>
