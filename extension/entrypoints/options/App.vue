<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { AppSettings, UpdateInterval } from '@/types/storage'
import { STORAGE_DEFAULTS } from '@/types/storage'
import ShadButton from '@/components/shadcn/Button.vue'
import ShadCard from '@/components/shadcn/Card.vue'

// 設定狀態
const settings = ref<AppSettings>({ ...STORAGE_DEFAULTS.settings })
const loading = ref(true)
const saving = ref(false)
const saveMessage = ref('')

// 更新頻率選項
const intervalOptions: { value: UpdateInterval; label: string }[] = [
  { value: 30, label: '30 分鐘' },
  { value: 60, label: '1 小時' },
  { value: 120, label: '2 小時' },
  { value: 360, label: '6 小時' },
]

onMounted(async () => {
  await loadSettings()
})

async function loadSettings() {
  try {
    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // @ts-ignore
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response: any) => {
        if (chrome.runtime.lastError) {
          console.error('載入設定失敗:', chrome.runtime.lastError)
          loading.value = false
          return
        }
        if (response?.success && response.data) {
          settings.value = { ...STORAGE_DEFAULTS.settings, ...response.data }
        }
        loading.value = false
      })
    } else {
      loading.value = false
    }
  } catch (error) {
    console.error('載入設定失敗:', error)
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  saveMessage.value = ''
  
  try {
    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // @ts-ignore
      chrome.runtime.sendMessage(
        { type: 'UPDATE_SETTINGS', data: settings.value },
        (response: any) => {
          if (chrome.runtime.lastError) {
            console.error('儲存設定失敗:', chrome.runtime.lastError)
            saveMessage.value = '儲存失敗，請稍後再試'
            saving.value = false
            return
          }
          if (response?.success) {
            saveMessage.value = '設定已儲存！'
            setTimeout(() => { saveMessage.value = '' }, 2000)
          } else {
            saveMessage.value = '儲存失敗，請稍後再試'
          }
          saving.value = false
        }
      )
    }
  } catch (error) {
    console.error('儲存設定失敗:', error)
    saveMessage.value = '儲存失敗，請稍後再試'
    saving.value = false
  }
}

function testNotification() {
  // @ts-ignore
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // @ts-ignore
    chrome.runtime.sendMessage({ type: 'TEST_NOTIFICATION' }, (response: any) => {
      if (chrome.runtime.lastError) {
        console.error('發送通知失敗:', chrome.runtime.lastError)
        return
      }
      if (response?.success) {
        saveMessage.value = '測試通知已發送！'
        setTimeout(() => { saveMessage.value = '' }, 2000)
      }
    })
  }
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} 分鐘`
  if (minutes === 60) return '1 小時'
  return `${minutes / 60} 小時`
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-[#f3e7de] to-[#f8eee7]">
    <!-- Header -->
    <header class="bg-[#e8d5c4] border-b border-[#d6b089] px-6 py-4">
      <div class="max-w-2xl mx-auto flex items-center gap-3">
        <img src="/logo.png" alt="星詠賣場助手" class="w-10 h-10 rounded-full object-cover" />
        <div>
          <h1 class="text-xl font-bold text-[#8b4f2b]">星詠賣場助手 - 設定</h1>
          <p class="text-xs text-[#8b4f2b]/70">設定自動更新與通知功能</p>
        </div>
      </div>
    </header>

    <!-- 主要內容 -->
    <main class="p-6">
      <div class="max-w-2xl mx-auto space-y-6">
        
        <!-- 載入中 -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="flex flex-col items-center gap-3 text-[#8b4f2b]/60">
            <div class="w-8 h-8 border-3 border-[#d6b089] border-t-[#8b4f2b] rounded-full animate-spin"></div>
            <span>載入中...</span>
          </div>
        </div>

        <!-- 設定區塊 -->
        <template v-else>
          
          <!-- 自動更新設定 -->
          <ShadCard class="p-6">
            <h2 class="text-lg font-bold text-[#8b4f2b] mb-4 flex items-center gap-2">
              <span>🔄</span>
              <span>自動更新設定</span>
            </h2>
            
            <div class="space-y-4">
              <!-- 自動更新開關 -->
              <div class="flex items-center justify-between py-2 border-b border-[#d6b089]/30">
                <div>
                  <p class="font-medium text-[#3b2b22]">啟用自動更新</p>
                  <p class="text-sm text-[#8b4f2b]/70">定期自動更新追蹤商品的成交價格</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="settings.autoUpdateEnabled"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-[#d6b089] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8b4f2b]"></div>
                </label>
              </div>

              <!-- 更新頻率 -->
              <div class="flex items-center justify-between py-2 border-b border-[#d6b089]/30">
                <div>
                  <p class="font-medium text-[#3b2b22]">更新頻率</p>
                  <p class="text-sm text-[#8b4f2b]/70">每隔多久檢查一次價格更新</p>
                </div>
                <select 
                  v-model.number="settings.updateInterval"
                  class="bg-[#f8eee7] border border-[#d6b089] text-[#3b2b22] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8b4f2b]"
                  :disabled="!settings.autoUpdateEnabled"
                >
                  <option v-for="opt in intervalOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <!-- 說明區塊 -->
              <div class="bg-[#f8eee7] rounded-lg p-4 text-sm text-[#8b4f2b]/70">
                <p class="font-medium mb-2">💡 運作說明</p>
                <ul class="list-disc list-inside space-y-1">
                  <li>系統每 1 分鐘檢查一次是否有商品需要更新</li>
                  <li>每次只更新一個商品，避免對 API 造成負擔</li>
                  <li>商品會依照「最後更新時間」排序，優先更新較舊的資料</li>
                  <li>假設您追蹤 10 個商品，設定 1 小時更新，全部更新完成約需 10 分鐘</li>
                </ul>
              </div>
            </div>
          </ShadCard>

          <!-- 通知設定 -->
          <ShadCard class="p-6">
            <h2 class="text-lg font-bold text-[#8b4f2b] mb-4 flex items-center gap-2">
              <span>🔔</span>
              <span>通知設定</span>
            </h2>
            
            <div class="space-y-4">
              <!-- 通知開關 -->
              <div class="flex items-center justify-between py-2 border-b border-[#d6b089]/30">
                <div>
                  <p class="font-medium text-[#3b2b22]">啟用價格通知</p>
                  <p class="text-sm text-[#8b4f2b]/70">當追蹤商品的最低價下降時發送通知</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="settings.notifyEnabled"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-[#d6b089] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8b4f2b]"></div>
                </label>
              </div>

              <!-- 測試通知 -->
              <div class="flex items-center justify-between py-2">
                <div>
                  <p class="font-medium text-[#3b2b22]">測試通知</p>
                  <p class="text-sm text-[#8b4f2b]/70">發送一則測試通知確認功能正常</p>
                </div>
                <ShadButton 
                  variant="outline" 
                  size="sm"
                  @click="testNotification"
                >
                  發送測試通知
                </ShadButton>
              </div>
            </div>
          </ShadCard>

          <!-- 儲存按鈕 -->
          <div class="flex items-center justify-between">
            <p v-if="saveMessage" class="text-sm text-[#8b4f2b]">{{ saveMessage }}</p>
            <p v-else class="text-sm text-[#8b4f2b]/50">變更將自動儲存</p>
            <ShadButton 
              :disabled="saving"
              @click="saveSettings"
            >
              {{ saving ? '儲存中...' : '儲存設定' }}
            </ShadButton>
          </div>

        </template>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-[#e8d5c4] border-t border-[#d6b089] px-6 py-4 mt-auto">
      <p class="text-center text-xs text-[#8b4f2b]/50">
        Star Trade Assistant v1.0 beta
      </p>
    </footer>
  </div>
</template>

<style>
/* 載入動畫 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 邊框寬度 */
.border-3 {
  border-width: 3px;
}
</style>