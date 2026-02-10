<script lang="ts" setup>
import '@/assets/tailwind.css';
import { ref, onMounted } from 'vue';
import { getStorage } from '@/utils/storage';
import { getExtensionUrl } from '@/utils/messaging';
import ShadButton from '@/components/shadcn/Button.vue';
import ShadCard from '@/components/shadcn/Card.vue';
import ShadBadge from '@/components/shadcn/Badge.vue';
import ShadTable from '@/components/shadcn/Table.vue';
import ShadTableHeader from '@/components/shadcn/TableHeader.vue';
import ShadTableBody from '@/components/shadcn/TableBody.vue';
import ShadTableRow from '@/components/shadcn/TableRow.vue';
import ShadTableCell from '@/components/shadcn/TableCell.vue';
import type { TrackedItem } from '@/types/messages';

const trackedItems = ref<TrackedItem[]>([]);

/**
 * 從存儲加載追蹤的項目
 */
async function loadItems() {
  try {
    const stored = await getStorage('trackedItems');
    trackedItems.value = stored || [];

    // 如果沒有項目，顯示示例數據
    if (!trackedItems.value || trackedItems.value.length === 0) {
      trackedItems.value = [
        {
          name: '小圓盾',
          price: 2000,
          stall: 'S1 [69,111]',
          priceType: '0',
          addedAt: Date.now(),
        },
        {
          name: '辛的皮膚(永久)',
          price: 6000,
          stall: 'S1 [18,45]',
          priceType: '0',
          addedAt: Date.now(),
        },
        {
          name: '頭像框(新年)',
          price: 333,
          stall: 'S2 [5,12]',
          priceType: '0',
          addedAt: Date.now(),
        },
      ];
    }
  } catch (error) {
    console.error('Failed to load tracked items:', error);
    trackedItems.value = [];
  }
}

/**
 * 打開市場搜尋頁面
 */
function openMarket() {
  const url = getExtensionUrl('market.html');
  window.open(url, '_blank');
}

onMounted(loadItems);
</script>

<template>
  <div id="popup-root" class="bg-gradient-to-b from-[#f3e7de] to-[#f8eee7] min-h-screen">
    <div class="max-w-md mx-auto p-4 space-y-4">
      <!-- Header with Button -->
      <div class="flex justify-center pt-2">
        <ShadButton variant="default" @click="openMarket">前往賣場</ShadButton>
      </div>

      <!-- Tracked Items Card -->
      <ShadCard class="p-4">
        <h2 class="text-lg font-bold text-[#8b4f2b] mb-4">追蹤的商品</h2>
        <ShadTable>
          <ShadTableHeader>
            <ShadTableRow>
              <ShadTableCell isHeader>商品名稱</ShadTableCell>
              <ShadTableCell isHeader>價格</ShadTableCell>
              <ShadTableCell isHeader>攤位</ShadTableCell>
            </ShadTableRow>
          </ShadTableHeader>
          <ShadTableBody>
            <ShadTableRow v-for="(item, idx) in trackedItems" :key="idx">
              <ShadTableCell>{{ item.name }}</ShadTableCell>
              <ShadTableCell>
                <ShadBadge variant="secondary">{{ item.price }}</ShadBadge>
              </ShadTableCell>
              <ShadTableCell class="text-xs">{{ item.stall }}</ShadTableCell>
            </ShadTableRow>
            <ShadTableRow v-if="!trackedItems || trackedItems.length === 0">
              <ShadTableCell colspan="3" class="text-center text-gray-500 py-4">
                暫無追蹤商品
              </ShadTableCell>
            </ShadTableRow>
          </ShadTableBody>
        </ShadTable>
      </ShadCard>
    </div>
  </div>
</template>

<style scoped>
/* Styles are managed via Tailwind CSS */
</style>
