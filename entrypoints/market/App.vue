<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import {
  useVueTable,
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/vue-table';
import { columns, buildRowsFromApi } from './columns';
import { sendMessage } from '@/utils/messaging';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/utils/constants';
import type { Payment, ItemType, PriceType } from '@/types/market';
import type { FetchMarketResponse, TrackedItem, MarketHistoryRecord } from '@/types/messages';
import { getStorage, setStorage } from '@/utils/storage';
import { STORAGE_DEFAULTS } from '@/types/storage';
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
import MapViewer from '@/components/MapViewer.vue';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shadcn/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/ui/tabs';
import { NumberField, NumberFieldInput, NumberFieldIncrement, NumberFieldDecrement } from '@/components/shadcn/ui/number-field';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/shadcn/ui/navigation-menu';
import { bountyEquipment, bountyPets, groupBountyEquipmentByCategory } from '@/utils/bountyData';
import { fetchMarketHistory } from '@/utils/api';

const q = ref('');
const nameFilter = ref('');
const allRows = ref<Payment[]>([]);
const loading = ref(false);
const selectedType = ref<ItemType | 'all'>('all');
const selectedPrice = ref<PriceType | 'all'>('all');
const selectedServer = ref<'all' | 'S1' | 'S2' | 'S3'>('all');
const magicCrystalRatio = ref(STORAGE_DEFAULTS.magicCrystalRatio);
const sorting = ref<SortingState>([{ id: 'sortablePrice', desc: false }]);

// 地圖對話框狀態
const showMapDialog = ref(false);
const mapDialogX = ref(0);
const mapDialogY = ref(0);

// 懸賞對話框狀態
const showBountyDialog = ref(false);

// 追蹤清單
const trackedItems = ref<TrackedItem[]>([]);
const currentView = ref<'search' | 'tracked'>('search');
const updatingPrices = ref<Set<string>>(new Set());

// 歷史成交明細對話框
const showHistoryDialog = ref(false);
const selectedHistoryItem = ref<TrackedItem | null>(null);

// 按類別分組的懸賞裝備
const groupedBountyEquipment = computed(() => groupBountyEquipmentByCategory());

// 武器種類列表（按特定順序）
const weaponCategories = ['劍', '斧', '矛', '弓', '杖', '小刀', '回力鏢', '頭盔', '帽子', '鎧甲', '衣服', '袍', '靴子', '鞋', '盾'];

// 載入魔晶比值和追蹤清單
onMounted(async () => {
  // 載入魔晶比值
  try {
    const savedRatio = await getStorage('magicCrystalRatio');
    if (savedRatio !== undefined) {
      magicCrystalRatio.value = savedRatio;
    }
  } catch (error) {
    console.error('載入魔晶比值失敗:', error);
  }
  
  // 載入追蹤清單
  try {
    const savedItems = await getStorage('trackedItems');
    console.log('從 storage 載入追蹤清單:', savedItems);
    if (savedItems !== undefined && Array.isArray(savedItems)) {
      trackedItems.value = savedItems;
      console.log('追蹤清單已載入，數量:', trackedItems.value.length);
    } else {
      console.log('沒有找到追蹤清單資料或資料格式不正確');
      trackedItems.value = [];
    }
  } catch (error) {
    console.error('載入追蹤清單失敗:', error);
    trackedItems.value = [];
  }
});

// 監聽魔晶比值變化並儲存
watch(magicCrystalRatio, async (newValue) => {
  await setStorage('magicCrystalRatio', newValue);
});

/**
 * 選擇懸賞物品進行搜尋
 */
function selectBountyItem(itemName: string) {
  q.value = itemName;
  showBountyDialog.value = false;
  doSearch();
}

/**
 * 計算過濾和排序後的數據
 */
// 計算各類型數量（在所有過濾之前）
const typeCounts = computed(() => {
  const source = allRows.value || [];
  return {
    item: source.filter((row) => row.type === 'item').length,
    pet: source.filter((row) => row.type === 'pet').length,
  };
});

// 計算各價格單位數量（在所有過濾之前）
const priceCounts = computed(() => {
  const source = allRows.value || [];
  return {
    '0': source.filter((row) => row.priceType === '0').length,
    '1': source.filter((row) => row.priceType === '1').length,
  };
});

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

  // 按伺服器過濾
  if (selectedServer.value !== 'all') {
    result = result.filter((item) => item.server === selectedServer.value);
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
    return columns(addTracked, (x, y) => {
      mapDialogX.value = x;
      mapDialogY.value = y;
      showMapDialog.value = true;
    });
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: (updaterOrValue) => {
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
 * 計算歷史成交價格統計（魔晶會先轉換為金幣）
 */
function calculatePriceStats(history: MarketHistoryRecord[]) {
  if (history.length === 0) return { minPrice: undefined, avgPrice: undefined };
  
  // 將價格轉換為統一單位（金幣），魔晶需乘上魔晶比值
  const prices = history.map((h) => {
    if (h.priceType === '1') {
      return h.price * magicCrystalRatio.value;
    }
    return h.price;
  });
  
  const minPrice = Math.round(Math.min(...prices));
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  
  return { minPrice, avgPrice };
}

/**
 * 更新單個項目的成交價格
 */
async function updateItemPrice(item: TrackedItem) {
  updatingPrices.value.add(item.name);
  
  try {
    const historyType = item.type === 'pet' ? 'pet' : 'item';
    const history = await fetchMarketHistory(item.name, historyType, 3);
    const { minPrice, avgPrice } = calculatePriceStats(history);
    
    // 確保 trackedItems.value 是陣列
    if (!Array.isArray(trackedItems.value)) {
      trackedItems.value = [];
    }
    
    const index = trackedItems.value.findIndex((i) => i.name === item.name);
    if (index !== -1) {
      trackedItems.value[index] = {
        ...trackedItems.value[index],
        minPrice,
        avgPrice,
        lastUpdated: Date.now(),
        historyData: history,
      };
      // 確保儲存的是純陣列
      const itemsToSave = [...trackedItems.value];
      await setStorage('trackedItems', itemsToSave);
    }
  } catch (error) {
    console.error('更新價格失敗:', error);
    alert('更新價格失敗');
  } finally {
    updatingPrices.value.delete(item.name);
  }
}

/**
 * 更新所有追蹤項目的成交價格
 */
async function updateAllPrices() {
  for (const item of trackedItems.value) {
    await updateItemPrice(item);
  }
}

/**
 * 添加項目到追蹤列表
 */
async function addTracked(row: Payment) {
  // 確保 trackedItems.value 是陣列
  if (!Array.isArray(trackedItems.value)) {
    trackedItems.value = [];
  }
  
  // 檢查是否已存在（根據名稱唯一）
  const exists = trackedItems.value.some((item) => item.name === row.name);

  if (exists) {
    alert('此商品已在追蹤清單中');
    return;
  }

  const item: TrackedItem = {
    name: row.name,
    type: row.type,
    addedAt: Date.now(),
  };

  trackedItems.value.push(item);
  // 確保儲存的是純陣列
  const itemsToSave = [...trackedItems.value];
  console.log('儲存追蹤清單:', itemsToSave);
  await setStorage('trackedItems', itemsToSave);
  alert(SUCCESS_MESSAGES.ITEM_TRACKED);
}

/**
 * 從追蹤清單移除項目
 */
async function removeTracked(index: number) {
  try {
    trackedItems.value.splice(index, 1);
    // 確保儲存的是純陣列
    const itemsToSave = [...trackedItems.value];
    await setStorage('trackedItems', itemsToSave);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    alert(`移除失敗：${errorMsg}`);
  }
}

/**
 * 清空追蹤清單
 */
async function clearTracked() {
  if (!confirm('確定要清空所有追蹤項目嗎？')) {
    return;
  }
  
  try {
    trackedItems.value = [];
    await setStorage('trackedItems', []);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    alert(`清空失敗：${errorMsg}`);
  }
}

/**
 * 開啟歷史成交明細對話框
 */
function openHistoryDialog(item: TrackedItem) {
  selectedHistoryItem.value = item;
  showHistoryDialog.value = true;
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-[#f3e7de] to-[#f8eee7] p-6">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Header with NavigationMenu -->
      <div class="flex items-center justify-between bg-[#e8d5c4] rounded-lg px-6 py-4 border border-[#d6b089]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-[#8b4f2b] rounded-full flex items-center justify-center">
            <span class="text-white text-lg font-bold">星</span>
          </div>
          <h1 class="text-2xl font-bold text-[#8b4f2b]">星詠魔力 賣場搜尋</h1>
        </div>
        <NavigationMenu>
          <NavigationMenuList class="flex gap-2">
            <NavigationMenuItem>
              <NavigationMenuLink 
                class="bg-transparent hover:bg-[#d6b089] text-[#2b160e] px-4 py-2 rounded-md transition-colors"
                href="#"
                @click.prevent="currentView = 'search'"
                :class="{ 'bg-[#d6b089]': currentView === 'search' }"
              >
                賣場搜尋
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                class="bg-transparent hover:bg-[#d6b089] text-[#2b160e] px-4 py-2 rounded-md transition-colors"
                href="#"
                @click.prevent="currentView = 'tracked'"
                :class="{ 'bg-[#d6b089]': currentView === 'tracked' }"
              >
                追蹤清單 ({{ trackedItems.length }})
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <!-- 追蹤清單頁面 -->
      <template v-if="currentView === 'tracked'">
        <ShadCard class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-[#8b4f2b]">我的追蹤清單</h2>
            <div class="flex gap-2">
              <ShadButton
                v-if="trackedItems.length > 0"
                variant="outline"
                size="sm"
                class="border-[#d6b089] text-[#2b160e] hover:bg-[#d6b089]"
                :disabled="updatingPrices.size > 0"
                @click="updateAllPrices"
              >
                {{ updatingPrices.size > 0 ? '更新中...' : '更新全部價格' }}
              </ShadButton>
              <ShadButton
                v-if="trackedItems.length > 0"
                variant="destructive"
                size="sm"
                @click="clearTracked"
              >
                清空清單
              </ShadButton>
            </div>
          </div>

          <div v-if="trackedItems.length === 0" class="text-center py-12">
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
                  <ShadTableCell :is-header="true" class="text-center">最後更新時間</ShadTableCell>
                  <ShadTableCell :is-header="true" class="text-center">歷史成交明細</ShadTableCell>
                  <ShadTableCell :is-header="true" class="text-center">功能</ShadTableCell>
                </ShadTableRow>
              </ShadTableHeader>
              <ShadTableBody>
                <ShadTableRow v-for="(item, index) in trackedItems" :key="index">
                  <ShadTableCell>
                    <div
                      class="px-2 py-1 rounded-full text-xs text-center"
                      :class="item.type === 'pet' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'"
                    >
                      {{ item.type === 'pet' ? '寵物' : '道具' }}
                    </div>
                  </ShadTableCell>
                  <ShadTableCell class="text-center font-medium">
                    <div class="text-center">{{ item.name }}</div>
                  </ShadTableCell>
                  <ShadTableCell>
                    <div v-if="item.minPrice !== undefined" class="text-center">
                      {{ new Intl.NumberFormat('en-US').format(item.minPrice) }}
                    </div>
                    <div v-else class="text-[#8b4f2b]/40 text-center">-</div>
                  </ShadTableCell>
                  <ShadTableCell>
                    <div v-if="item.avgPrice !== undefined" class="text-center">
                      {{ new Intl.NumberFormat('en-US').format(item.avgPrice) }}
                    </div>
                    <div v-else class="text-[#8b4f2b]/40 text-center">-</div>
                  </ShadTableCell>
                  <ShadTableCell>
                    <div v-if="item.lastUpdated" class="text-sm text-[#8b4f2b]/70 text-center">
                      {{ new Date(item.lastUpdated).toLocaleString('zh-TW') }}
                    </div>
                    <div v-else class="text-[#8b4f2b]/40 text-center">-</div>
                  </ShadTableCell>
                  <ShadTableCell>
                    <div class="text-center">
                      <ShadButton
                        variant="outline"
                        size="sm"
                        class="border-[#d6b089] text-[#2b160e] hover:bg-[#d6b089]"
                        :disabled="!item.historyData || item.historyData.length === 0"
                        @click="openHistoryDialog(item)"
                      >
                        查看({{ item.historyData?.length || 0 }})
                      </ShadButton>
                    </div>
                  </ShadTableCell>
                  <ShadTableCell>
                    <div class="flex justify-center gap-2">
                      <ShadButton
                        variant="outline"
                        size="sm"
                        class="border-[#d6b089] text-[#2b160e] hover:bg-[#d6b089]"
                        :disabled="updatingPrices.has(item.name)"
                        @click="updateItemPrice(item)"
                      >
                        {{ updatingPrices.has(item.name) ? '更新中' : '更新成交價' }}
                      </ShadButton>
                      <ShadButton
                        variant="outline"
                        size="sm"
                        class="border-[#d6b089] text-[#2b160e] hover:bg-[#d6b089]"
                        @click="q = item.name; currentView = 'search'; doSearch();"
                      >
                        搜尋
                      </ShadButton>
                      <ShadButton
                        variant="ghost"
                        size="sm"
                        class="text-red-500 hover:text-red-700 hover:bg-red-50"
                        @click="removeTracked(index)"
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
      </template>

      <!-- 搜尋頁面 -->
      <template v-else>
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
          <!-- 懸賞快速查詢按鈕 -->
          <div class="mt-4">
            <Dialog v-model:open="showBountyDialog">
              <DialogTrigger as-child>
                <ShadButton variant="outline" size="sm">
                  🎯 懸賞裝備及寵物
                </ShadButton>
              </DialogTrigger>
              <DialogContent class="max-w-3xl max-h-[80vh] overflow-y-auto bg-[#f8eee7] border-[#d6b089]">
                <DialogHeader>
                  <DialogTitle class="text-[#8b4f2b]">懸賞裝備及寵物快速查詢</DialogTitle>
                </DialogHeader>
                <Tabs default-value="equipment" class="w-full">
                  <TabsList class="grid w-full grid-cols-2 bg-[#e8d5c4]">
                    <TabsTrigger value="equipment" class="data-[state=active]:bg-[#d6b089] data-[state=active]:text-[#2b160e]">懸賞裝備</TabsTrigger>
                    <TabsTrigger value="pets" class="data-[state=active]:bg-[#d6b089] data-[state=active]:text-[#2b160e]">懸賞寵物</TabsTrigger>
                  </TabsList>
                  
                  <!-- 懸賞裝備 Tab -->
                  <TabsContent value="equipment" class="space-y-4 mt-4">
                    <div v-for="category in weaponCategories" :key="category" class="border-b border-[#d6b089] pb-4 last:border-0">
                      <h3 class="text-sm font-bold text-[#8b4f2b] mb-2">{{ category }}</h3>
                      <div class="flex flex-wrap gap-2">
                        <ShadButton
                          v-for="item in groupedBountyEquipment[category]"
                          :key="item.name"
                          variant="outline"
                          size="sm"
                          class="text-xs border-[#d6b089] text-[#2b160e] hover:bg-[#d6b089] hover:text-[#2b160e]"
                          @click="selectBountyItem(item.name)"
                        >
                          {{ item.name }}
                        </ShadButton>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <!-- 懸賞寵物 Tab -->
                  <TabsContent value="pets" class="mt-4">
                    <div class="flex flex-wrap gap-2">
                      <ShadButton
                        v-for="pet in bountyPets"
                        :key="pet"
                        variant="outline"
                        size="sm"
                        class="text-xs border-[#d6b089] text-[#2b160e] hover:bg-[#d6b089] hover:text-[#2b160e]"
                        @click="selectBountyItem(pet)"
                      >
                        {{ pet }}
                      </ShadButton>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </ShadCard>

        <!-- Filter Section -->
        <ShadCard class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Name Filter -->
            <div class="space-y-2">
              <label class="text-sm font-semibold text-[#3b2b22]">名稱篩選</label>
              <ShadInput v-model="nameFilter" placeholder="篩選名稱、攤位、伺服器…" />
            </div>

            <!-- Magic Crystal Ratio -->
            <div class="space-y-2">
              <label class="text-sm font-semibold text-[#3b2b22]">魔晶比值</label>
              <NumberField v-model="magicCrystalRatio" :min="1" :step="1">
                <div class="relative">
                  <NumberFieldInput 
                    class="h-10 w-full rounded-md border border-[#d6b089] bg-white px-3 py-2 text-sm text-[#2b160e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b089]"
                  />
                  <NumberFieldIncrement class="absolute right-0 top-0 h-1/2 w-6 border border-[#d6b089] bg-[#f8eee7] hover:bg-[#d6b089] flex items-center justify-center rounded-tr-md" />
                  <NumberFieldDecrement class="absolute right-0 bottom-0 h-1/2 w-6 border border-[#d6b089] bg-[#f8eee7] hover:bg-[#d6b089] flex items-center justify-center rounded-br-md" />
                </div>
              </NumberField>
            </div>
          </div>
        </ShadCard>

        <!-- Advanced Filter Section -->
        <ShadCard class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  {{ 
                    t === 'all' 
                      ? `全部(${allRows.length})` 
                      : t === 'item' 
                        ? `僅道具(${typeCounts.item})` 
                        : `僅寵物(${typeCounts.pet})` 
                  }}
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
                  {{ 
                    p === 'all' 
                      ? `全部(${allRows.length})` 
                      : p === '0' 
                        ? `金幣(${priceCounts['0']})` 
                        : `魔晶(${priceCounts['1']})` 
                  }}
                </ShadButton>
              </div>
            </div>

            <!-- Server Filter -->
            <div class="space-y-2">
              <label class="text-sm font-semibold text-[#3b2b22]">伺服器</label>
              <div class="flex flex-wrap gap-2">
                <ShadButton
                  v-for="s in ['all', '1', '2', '3'] as const"
                  :key="s"
                  :variant="selectedServer === s ? 'default' : 'outline'"
                  size="sm"
                  @click="selectedServer = s as any"
                >
                  {{ s === 'all' ? '全部' : s }}
                </ShadButton>
              </div>
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
      </template>

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

      <!-- 歷史成交明細對話框 -->
      <Dialog v-model:open="showHistoryDialog">
        <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto bg-[#f8eee7] border-[#d6b089]">
          <DialogHeader>
            <DialogTitle class="text-[#8b4f2b]">
              {{ selectedHistoryItem?.name }} - 歷史成交明細
            </DialogTitle>
          </DialogHeader>
          <div v-if="selectedHistoryItem?.historyData && selectedHistoryItem.historyData.length > 0">
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
                <ShadTableRow v-for="(record, idx) in selectedHistoryItem.historyData" :key="idx">
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
                      record.priceType === '1' ? record.price * magicCrystalRatio.value : record.price
                    ) }}
                  </ShadTableCell>
                  <ShadTableCell class="text-center">{{ record.buyerName }}</ShadTableCell>
                </ShadTableRow>
              </ShadTableBody>
            </ShadTable>
            <div class="mt-4 text-sm text-[#8b4f2b]/70">
              <p>魔晶比值: {{ magicCrystalRatio }}</p>
              <p>共 {{ selectedHistoryItem.historyData.length }} 筆成交記錄</p>
            </div>
          </div>
          <div v-else class="text-center py-12 text-[#8b4f2b]/60">
            無歷史成交資料
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
