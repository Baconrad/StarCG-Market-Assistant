<script setup lang="ts">
import { computed } from 'vue'
import { groupBountyEquipmentByCategory, bountyPets } from '../utils/bountyData'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './shadcn/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './shadcn/ui/tabs'
import ShadButton from './shadcn/Button.vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [name: string]
}>()

const weaponCategories = ['劍', '斧', '矛', '弓', '杖', '小刀', '回力鏢', '頭盔', '帽子', '鎧甲', '衣服', '袍', '靴子', '鞋', '盾']

const groupedEquipment = computed(() => groupBountyEquipmentByCategory())

function onSelect(name: string) {
  emit('select', name)
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-3xl max-h-[80vh] overflow-y-auto bg-[#f8eee7] border-[#d6b089]">
      <DialogHeader>
        <DialogTitle class="text-[#8b4f2b]">懸賞裝備及寵物快速查詢</DialogTitle>
      </DialogHeader>
      <Tabs default-value="equipment" class="w-full">
        <TabsList class="grid w-full grid-cols-2 bg-[#e8d5c4]">
          <TabsTrigger value="equipment" class="data-[state=active]:bg-[#d6b089]">
            懸賞裝備
          </TabsTrigger>
          <TabsTrigger value="pets" class="data-[state=active]:bg-[#d6b089]">
            懸賞寵物
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" class="space-y-4 mt-4">
          <div
            v-for="category in weaponCategories"
            :key="category"
            class="border-b border-[#d6b089] pb-4 last:border-0"
          >
            <h3 class="text-sm font-bold text-[#8b4f2b] mb-2">{{ category }}</h3>
            <div class="flex flex-wrap gap-2">
              <ShadButton
                v-for="item in groupedEquipment[category]"
                :key="item.name"
                variant="outline"
                size="sm"
                @click="onSelect(item.name)"
              >
                {{ item.name }}
              </ShadButton>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pets" class="mt-4">
          <div class="flex flex-wrap gap-2">
            <ShadButton
              v-for="pet in bountyPets"
              :key="pet"
              variant="outline"
              size="sm"
              @click="onSelect(pet)"
            >
              {{ pet }}
            </ShadButton>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
