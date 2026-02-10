<script setup lang="ts">
defineProps<{
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}>();

const variantClasses = {
  default: 'bg-[#c99b71] text-[#2b1a10]',
  secondary: 'bg-[#e8d5c8] text-[#3b2b22]',
  destructive: 'bg-red-100 text-red-800',
  outline: 'border border-[#d6b089] bg-transparent text-[#3b2b22]'
};
</script>

<template>
  <span :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', variantClasses[variant || 'default']]">
    <slot />
  </span>
</template>
