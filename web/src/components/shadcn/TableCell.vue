<script setup lang="ts">
defineProps<{
  isHeader?: boolean;
}>();
</script>

<template>
  <component 
    :is="isHeader ? 'th' : 'td'"
    :class="isHeader ? 'p-3 text-center text-sm' : 'p-3 text-center text-sm'"
  >
    <slot />
  </component>
</template>
