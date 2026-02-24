<script setup lang="ts">
defineProps<{
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
}>();

const variantClasses = {
  default: 'bg-[#c99b71] hover:bg-[#b07f57] text-[#2b1a10]',
  secondary: 'bg-[#e8d5c8] hover:bg-[#d6b089] text-[#3b2b22]',
  destructive: 'bg-red-500 hover:bg-red-600 text-white',
  outline: 'border border-[#d6b089] bg-transparent hover:bg-[#fff8f2] text-[#3b2b22]',
  ghost: 'hover:bg-[#fff8f2] text-[#3b2b22]'
};

const sizeClasses = {
  default: 'px-4 py-2',
  sm: 'px-2 py-1 text-sm',
  lg: 'px-6 py-3 text-lg'
};

const baseClasses = 'rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
</script>

<template>
  <button 
    :class="[
      baseClasses, 
      variantClasses[variant || 'default'],
      sizeClasses[size || 'default'],
      { 'opacity-50 cursor-not-allowed': disabled }
    ]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
