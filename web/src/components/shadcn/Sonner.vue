<script lang="ts" setup>
import { Toaster as Sonner } from 'vue-sonner'
</script>

<template>
  <Sonner
    class="toaster group"
    :toast-options="{
      classes: {
        toast: 'group toast group-[.toaster]:bg-[#f8eee7] group-[.toaster]:text-[#3b2b22] group-[.toaster]:border-[#d6b089] group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-[#8b4f2b]',
        actionButton: 'group-[.toast]:bg-[#8b4f2b] group-[.toast]:text-white',
        cancelButton: 'group-[.toast]:bg-[#d6b089] group-[.toast]:text-[#3b2b22]',
      },
    }"
  />
</template>
