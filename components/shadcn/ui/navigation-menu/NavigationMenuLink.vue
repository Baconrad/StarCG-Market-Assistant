<script setup lang="ts">
import type { NavigationMenuLinkProps } from "reka-ui"
import { NavigationMenuLink } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<NavigationMenuLinkProps & { class?: string }>()
</script>

<template>
  <NavigationMenuLink
    v-bind="props"
    :class="cn(
      'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50',
      props.class,
    )"
  >
    <slot />
  </NavigationMenuLink>
</template>
