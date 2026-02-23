<script setup lang="ts">
import { NumberFieldDecrement } from "reka-ui"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-vue-next"
</script>

<template>
  <NumberFieldDecrement
    :class="cn(
      'absolute right-0 bottom-0 h-1/2 w-6 border border-input bg-background p-0 hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center rounded-br-md',
      String($attrs.class ?? ''),
    )"
  >
    <ChevronDown class="h-3 w-3" />
  </NumberFieldDecrement>
</template>
