import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Payment, ItemType, PriceType } from '../types/market'
import type { MarketHistoryRecord, TrackedItem } from '../types/messages'

export const useMarketStore = defineStore('market', () => {
  // State
  const allRows = ref<Payment[]>([])
  const loading = ref(false)
  const magicCrystalRatio = ref(175)
  const trackedItems = ref<TrackedItem[]>([])
  const selectedType = ref<ItemType | 'all'>('all')
  const selectedPrice = ref<PriceType | 'all'>('all')
  const selectedServer = ref<'all' | 'S1' | 'S2' | 'S3'>('all')

  // Getters
  const typeCounts = computed(() => {
    const source = allRows.value || []
    return {
      item: source.filter((row) => row.type === 'item').length,
      pet: source.filter((row) => row.type === 'pet').length,
    }
  })

  const priceCounts = computed(() => {
    const source = allRows.value || []
    return {
      '0': source.filter((row) => row.priceType === '0').length,
      '1': source.filter((row) => row.priceType === '1').length,
    }
  })

  const filteredData = computed(() => {
    let result = allRows.value.map((row) => ({
      ...row,
      sortablePrice:
        row.priceType === '1' ? row.price * (magicCrystalRatio.value || 1) : row.price,
    }))

    if (selectedType.value !== 'all') {
      result = result.filter((item) => item.type === selectedType.value)
    }
    if (selectedPrice.value !== 'all') {
      result = result.filter((item) => item.priceType === selectedPrice.value)
    }
    if (selectedServer.value !== 'all') {
      result = result.filter((item) => item.server === selectedServer.value)
    }

    return result
  })

  // Actions
  function setRows(rows: Payment[]) {
    allRows.value = rows
  }

  function setLoading(value: boolean) {
    loading.value = value
  }

  function setMagicCrystalRatio(value: number) {
    magicCrystalRatio.value = value
    localStorage.setItem('magicCrystalRatio', String(value))
  }

  function loadMagicCrystalRatio() {
    const saved = localStorage.getItem('magicCrystalRatio')
    if (saved) {
      magicCrystalRatio.value = Number(saved)
    }
  }

  // Track items - 使用 Extension 儲存
  async function addTracked(item: TrackedItem) {
    const exists = trackedItems.value.some((i) => i.name === item.name)
    if (exists) return false
    
    // 發送到 extension 儲存
    try {
      const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID || 'ooiofmpdcmcjclbbphgkfhcnebpomded'
      // @ts-ignore
      await chrome.runtime.sendMessage(EXTENSION_ID, {
        type: 'ADD_TRACKED',
        data: { item }
      })
      // 更新本地狀態
      trackedItems.value.unshift(item)
      return true
    } catch (error) {
      console.error('Failed to add tracked item to extension:', error)
      return false
    }
  }

  async function removeTracked(index: number) {
    const item = trackedItems.value[index]
    if (!item) return
    
    try {
      const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID || 'ooiofmpdcmcjclbbphgkfhcnebpomded'
      // @ts-ignore
      await chrome.runtime.sendMessage(EXTENSION_ID, {
        type: 'REMOVE_TRACKED',
        data: { name: item.name }
      })
      // 更新本地狀態
      trackedItems.value.splice(index, 1)
    } catch (error) {
      console.error('Failed to remove tracked item from extension:', error)
    }
  }

  async function removeTrackedByName(name: string) {
    try {
      const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID || 'ooiofmpdcmcjclbbphgkfhcnebpomded'
      // @ts-ignore
      await chrome.runtime.sendMessage(EXTENSION_ID, {
        type: 'REMOVE_TRACKED',
        data: { name }
      })
      // 更新本地狀態
      const index = trackedItems.value.findIndex((i) => i.name === name)
      if (index !== -1) {
        trackedItems.value.splice(index, 1)
      }
    } catch (error) {
      console.error('Failed to remove tracked item from extension:', error)
    }
  }

  // 從 Extension 同步追蹤資料
  async function syncTrackedItems() {
    try {
      const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID || 'ooiofmpdcmcjclbbphgkfhcnebpomded'
      const response = await new Promise<{ success: boolean; data?: TrackedItem[] }>((resolve) => {
        // @ts-ignore
        chrome.runtime.sendMessage(EXTENSION_ID, { type: 'GET_TRACKED' }, resolve)
      })
      if (response?.success && response?.data) {
        trackedItems.value = response.data
      }
    } catch (error) {
      console.error('Failed to sync tracked items from extension:', error)
      // 回退到 localStorage
      loadTrackedItems()
    }
  }

  async function updateTrackedItem(index: number, data: Partial<TrackedItem>) {
    const item = trackedItems.value[index]
    if (!item) return
    
    // 更新本地狀態
    trackedItems.value[index] = { ...trackedItems.value[index], ...data }
    
    // 發送到 extension 儲存
    try {
      const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID || 'ooiofmpdcmcjclbbphgkfhcnebpomded'
      // @ts-ignore
      await chrome.runtime.sendMessage(EXTENSION_ID, {
        type: 'UPDATE_TRACKED',
        data: { name: item.name, updates: data }
      })
    } catch (error) {
      console.error('Failed to update tracked item in extension:', error)
    }
    
    // 同時保存到 localStorage 作為備份
    saveTrackedItems()
  }

  function saveTrackedItems() {
    localStorage.setItem('trackedItems', JSON.stringify(trackedItems.value))
  }

  function loadTrackedItems() {
    const saved = localStorage.getItem('trackedItems')
    if (saved) {
      try {
        trackedItems.value = JSON.parse(saved)
      } catch {
        trackedItems.value = []
      }
    }
  }

  function calculatePriceStats(history: MarketHistoryRecord[]) {
    if (history.length === 0) return { minPrice: undefined, avgPrice: undefined }
    const prices = history.map((h) => {
      if (h.priceType === '1') {
        return h.price * magicCrystalRatio.value
      }
      return h.price
    })
    const minPrice = Math.round(Math.min(...prices))
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    return { minPrice, avgPrice }
  }

  return {
    allRows,
    loading,
    magicCrystalRatio,
    trackedItems,
    selectedType,
    selectedPrice,
    selectedServer,
    typeCounts,
    priceCounts,
    filteredData,
    setRows,
    setLoading,
    setMagicCrystalRatio,
    loadMagicCrystalRatio,
    addTracked,
    removeTracked,
    removeTrackedByName,
    syncTrackedItems,
    updateTrackedItem,
    loadTrackedItems,
    calculatePriceStats,
  }
})
