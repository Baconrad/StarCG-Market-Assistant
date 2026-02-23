<script setup lang="ts">
import { computed } from 'vue';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MarketHistoryRecord } from '@/types/messages';

const props = defineProps<{
  data: MarketHistoryRecord[];
}>();

const chartData = computed(() => {
  // 按時間排序（舊到新）
  const sorted = [...props.data].sort((a, b) => a.time - b.time);
  
  return sorted.map((record) => ({
    date: record.timeText.split(' ')[0],
    time: record.timeText.split(' ')[1],
    price: record.price,
    priceType: record.priceType === '1' ? '魔晶' : '金幣',
    buyer: record.buyerName,
  }));
});

const formatPrice = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};
</script>

<template>
  <div class="w-full h-64">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart :data="chartData">
        <CartesianGrid strokeDasharray="3 3" stroke="#d6b089" />
        <XAxis 
          dataKey="date" 
          :tick="{ fontSize: 12 }"
          stroke="#8b4f2b"
        />
        <YAxis 
          :tickFormatter="formatPrice"
          :tick="{ fontSize: 12 }"
          stroke="#8b4f2b"
        />
        <Tooltip
          :contentStyle="{ backgroundColor: '#f8eee7', border: '1px solid #d6b089', borderRadius: '4px' }"
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#8b4f2b"
          :strokeWidth="2"
          :dot="{ fill: '#8b4f2b', strokeWidth: 2 }"
          :activeDot="{ r: 6, fill: '#d6b089' }"
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</template>
