<script setup lang="ts">
defineProps<{
  type?: string;
  placeholder?: string;
  modelValue?: string | number;
}>();

defineEmits<{
  'update:modelValue': [value: string | number];
}>();
</script>

<template>
  <input 
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    :type="type || 'text'"
    :placeholder="placeholder"
    class="w-full px-4 py-2 rounded-full bg-[#fff8f2] border border-[#d6b089] text-[#3b2b22] placeholder-[#9a8676] focus:outline-none focus:ring-2 focus:ring-[#c99b71] focus:border-transparent"
  />
</template>
