<script setup lang="ts">
import type { NavigationMenuRootEmits, NavigationMenuRootProps } from "reka-ui"
import { NavigationMenuRoot, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<NavigationMenuRootProps & { class?: string }>()
const emits = defineEmits<NavigationMenuRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <NavigationMenuRoot
    v-bind="forwarded"
    :class="cn(
      'relative z-10 flex max-w-max flex-1 items-center justify-center',
      props.class,
    )"
  >
    <slot />
  </NavigationMenuRoot>
</template>
