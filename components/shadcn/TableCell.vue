<script setup lang="ts">
defineProps<{
  isHeader?: boolean;
}>();
</script>

<template>
  <component 
    :is="isHeader ? 'th' : 'td'"
    class="p-3 text-left text-sm"
  >
    <slot />
  </component>
</template>
