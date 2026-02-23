<script setup lang="ts">
import type { NumberFieldRootEmits, NumberFieldRootProps } from "reka-ui"
import { NumberFieldRoot, useForwardPropsEmits } from "reka-ui"

const props = defineProps<NumberFieldRootProps>()
const emits = defineEmits<NumberFieldRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <NumberFieldRoot v-bind="forwarded" class="flex items-center">
    <slot />
  </NumberFieldRoot>
</template>
