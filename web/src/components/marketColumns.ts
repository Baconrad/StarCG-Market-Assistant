import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import ShadBadge from './shadcn/Badge.vue'
import ShadButton from './shadcn/Button.vue'
import { ArrowDown01, ArrowDown10, MapPin } from 'lucide-vue-next'
import type { Payment } from '../types/market'
import type { TrackedItem } from '../types/messages'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './shadcn/ui/tooltip'

/**
 * 計算攤位到期時間
 */
function getTimeUntilExpiration(timestamp: string): string {
  if (!timestamp) return ''

  const now = new Date()
  const past = new Date(Number(timestamp) * 1000)
  const diff = past.getTime() - now.getTime()

  if (diff <= 0) return '已到期'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days > 0) return `剩 ${days} 天`

  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours > 0) return `剩 ${hours} 小時`

  const minutes = Math.floor(diff / (1000 * 60))
  return `剩 ${minutes} 分鐘`
}

export const columns = (
  onTrack: (row: Payment) => void,
  _onRemoveTrack: (name: string) => void,
  trackedItems: TrackedItem[],
  onShowMap?: (x: number, y: number) => void
): ColumnDef<Payment>[] => [
  {
    accessorKey: 'type',
    header: '類型',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      return h('div', { class: 'text-center' }, [
        h(ShadBadge, { variant: type === 'item' ? 'secondary' : 'default' }, () =>
          type === 'item' ? '道具' : '寵物'
        ),
      ])
    },
  },
  {
    accessorKey: 'name',
    header: '商品名稱',
    cell: ({ row }) => {
      const { iconId, type, name } = row.original
      
      // 圖片 fallback 順序：
      // 1. 道具: https://member.starcg.net/metamo/item/{ID}.gif
      //    寵物: https://member.starcg.net/metamo/pet/PetHead/{ID}.png
      // 2. 道具 fallback: https://member.starcg.net/metamo/png/{ID}.png
      // 3. 最終 fallback: https://member.starcg.net/metamo/png/97004.png
      
      const primarySrc =
        type === 'item'
          ? `https://member.starcg.net/metamo/item/${iconId}.gif`
          : `https://member.starcg.net/metamo/pet/PetHead/${iconId}.png`
      
      const fallbackSrc =
        type === 'item'
          ? `https://member.starcg.net/metamo/png/${iconId}.png`
          : 'https://member.starcg.net/metamo/png/97004.png'
      
      const finalFallbackSrc = 'https://member.starcg.net/metamo/png/97004.png'
      
      // 處理圖片載入錯誤的事件處理函數
      const onImageError = (e: Event) => {
        const img = e.target as HTMLImageElement
        if (img.src === primarySrc) {
          // 第一次失敗，嘗試 fallback
          img.src = fallbackSrc
        } else if (img.src !== finalFallbackSrc) {
          // fallback 也失敗，使用最終 fallback
          img.src = finalFallbackSrc
        }
      }
      
      return h('div', { class: 'flex items-center gap-2' }, [
        h('img', { 
          src: primarySrc, 
          class: 'w-6 h-6 object-contain',
          onError: onImageError,
        }),
        h('span', name),
      ])
    },
  },
  {
    id: 'sortablePrice',
    accessorFn: (row) => row.sortablePrice,
    header: ({ column }) => {
      const sorted = column.getIsSorted()
      return h(
        ShadButton,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(sorted === 'asc'),
        },
        () =>
          h('span', { class: 'flex items-center' }, [
            '價格',
            sorted === 'asc'
              ? h(ArrowDown01, { class: 'ml-2 h-4 w-4' })
              : h(ArrowDown10, { class: 'ml-2 h-4 w-4' }),
          ])
      )
    },
    cell: ({ row }) => {
      const price = row.getValue('sortablePrice') as number
      return h(
        'div',
        { class: 'text-right' },
        new Intl.NumberFormat('en-US').format(price)
      )
    },
  },
  {
    accessorKey: 'priceType',
    header: '單位',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-center' },
        row.getValue('priceType') === '1' ? '魔晶' : '金幣'
      )
    },
  },
  {
    accessorKey: 'stallName',
    header: '攤位名稱',
    cell: ({ row }) => h('div', { class: 'text-center' }, row.getValue('stallName')),
  },
  {
    id: 'serverCoords',
    header: '伺服器/座標',
    cell: ({ row }) => {
      const server = row.original.server
      const coords = row.original.coords
      const x = row.original.x
      const y = row.original.y

      return h('div', { class: 'text-center' }, [
        h('span', { class: 'text-sm text-[#2b160e]' }, server),
        h('span', { class: 'mx-1 text-[#d6b089]' }, '/'),
        h(
          ShadButton,
          {
            variant: 'outline',
            size: 'sm',
            class: 'h-6 px-2 text-xs border-[#d6b089] text-[#2b160e] hover:bg-[#d6b089] hover:text-[#2b160e]',
            onClick: () => {
              onShowMap?.(x, y)
            },
          },
          () => h('span', { class: 'flex items-center gap-1' }, [
            h(MapPin, { class: 'h-3 w-3' }),
            coords,
          ])
        ),
      ])
    },
  },
  {
    accessorKey: 'startTime',
    header: '攤位到期時間',
    cell: ({ row }) => {
      const timestamp = row.getValue('startTime') as string
      const timeText = getTimeUntilExpiration(timestamp)
      const fullDate = timestamp
        ? new Date(Number(timestamp) * 1000).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
        : ''

      return h('div', { class: 'flex justify-center' }, [
        h(
          TooltipProvider,
          {},
          () =>
            h(Tooltip, {}, () => [
              h(TooltipTrigger, { class: 'cursor-pointer' }, () => timeText),
              h(TooltipContent, {}, () => fullDate),
            ])
        ),
      ])
    },
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => {
      const payment = row.original as Payment
      const isTracked = trackedItems.some(item => item.name === payment.name)
      
      return h('div', { class: 'text-center' }, [
        h(
          ShadButton,
          {
            size: 'sm',
            variant: isTracked ? 'outline' : 'secondary',
            class: isTracked ? 'border-red-500 text-red-500 hover:bg-red-50' : '',
            onClick: () => {
              onTrack(payment)
            },
          },
          () => isTracked ? '取消追蹤' : '追蹤'
        ),
      ])
    },
  },
]
