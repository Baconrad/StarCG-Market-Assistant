<script setup lang="ts">
import { NumberFieldIncrement } from "reka-ui"
import { cn } from "@/lib/utils"
import { ChevronUp } from "lucide-vue-next"
</script>

<template>
  <NumberFieldIncrement
    :class="cn(
      'absolute right-0 top-0 h-1/2 w-6 border border-input bg-background p-0 hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center rounded-tr-md',
      String($attrs.class ?? ''),
    )"
  >
    <ChevronUp class="h-3 w-3" />
  </NumberFieldIncrement>
</template>
