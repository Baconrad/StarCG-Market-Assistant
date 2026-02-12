import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import ShadBadge from '@/components/shadcn/Badge.vue'
import ShadButton from '@/components/shadcn/Button.vue'
import { ArrowDown01, ArrowDown10, MapPin } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shadcn/ui/tooltip'
import { getTimeUntilExpiration, extractStallCoordinates, extractCdKey } from '@/utils/api'
import type { Payment } from '@/types/market'
import type { MarketApiResponse, MarketStall, MarketItem, MarketPet } from '@/types/messages'

/**
 * 將 API 響應轉換為表格行數據
 */
export function buildRowsFromApi(apiResponse: MarketApiResponse): Payment[] {
  const out: Payment[] = []
  const { stalls, itemsByCd, petsByCd } = apiResponse

  for (const stall of stalls) {
    const cdKey = extractCdKey(stall)
    const stallName = String(stall.name ?? stall.stall_name ?? stall.storename ?? '')
    const server = String(stall.server ?? stall.server_name ?? '')
    const coords = extractStallCoordinates(stall)
    const startTime = String(stall.start_time ?? stall.time ?? stall.created_at ?? '')
    const x = Number(stall.x ?? 0)
    const y = Number(stall.y ?? 0)

    // 添加物品行
    if (cdKey && itemsByCd?.[cdKey]) {
      for (const item of itemsByCd[cdKey]) {
        out.push({
          type: 'item',
          name: String(item.ITEM_TRUENAME ?? item.name ?? item.itemName ?? ''),
          price: Number(item.price ?? item.Price ?? 0),
          priceType: String(item.pricetype ?? item.priceType ?? '0') as '0' | '1',
          stallName,
          server,
          coords,
          x,
          y,
          startTime,
          iconId: String(item.ITEM_BASEIMAGENUMBER ?? ''),
        })
      }
    }

    // 添加寵物行
    if (cdKey && petsByCd?.[cdKey]) {
      for (const pet of petsByCd[cdKey]) {
        const petName = String(pet.Name || pet.petName || '')

        out.push({
          type: 'pet',
          name: petName,
          price: Number(pet.price ?? 0),
          priceType: String(pet.pricetype ?? '0') as '0' | '1',
          stallName,
          server,
          coords,
          x,
          y,
          startTime,
          iconId: String(pet.Basebaseimgnum ?? ''),
        })
      }
    }
  }

  return out
}

/**
 * 表格列定義
 */
export const columns = (
  addTracked: (payment: Payment) => void,
  onShowMap?: (x: number, y: number) => void
): ColumnDef<Payment>[] => [
  {
    accessorKey: 'type',
    header: '類型',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const variant = type === 'item' ? 'secondary' : 'default'
      const text = type === 'item' ? '道具' : '寵物'
      return h('div', { class: 'flex justify-center' }, [
        h(ShadBadge, { variant }, () => text)
      ])
    },
  },
  {
    accessorKey: 'name',
    header: '商品名稱',
    cell: ({ row }) => {
      const { iconId, type, name } = row.original
      const imgSrc = buildImageUrl(type, iconId)

      return h('div', { class: 'flex items-center gap-2' }, [
        h('img', {
          src: imgSrc,
          class: 'w-6 h-6 object-contain',
          onError: (event: Event) => handleImageError(event, iconId),
        }),
        h('span', name),
      ])
    },
  },
  {
    accessorFn: (row) => Number((row as any).sortablePrice || row.price),
    id: 'sortablePrice',
    header: ({ column }) => {
      const sorted = column.getIsSorted()
      return h(
        ShadButton,
        {
          variant: 'ghost',
          onClick: (e: Event) => {
            e.stopPropagation();
            column.toggleSorting(sorted === 'asc');
          },
        },
        () =>
          h('span', { class: 'flex items-center' }, [
            '價格',
            sorted === 'asc' 
              ? h(ArrowDown01, { class: 'ml-2 h-4 w-4' })
              : sorted === 'desc'
                ? h(ArrowDown10, { class: 'ml-2 h-4 w-4' })
                : h(ArrowDown01, { class: 'ml-2 h-4 w-4 opacity-50' }),
          ])
      )
    },
    cell: ({ row }) => {
      const price = row.getValue('sortablePrice') as number
      const formatted = new Intl.NumberFormat('en-US').format(price)
      return h('div', { class: 'text-right' }, formatted)
    },
  },
  {
    accessorKey: 'priceType',
    header: '單位',
    cell: ({ row }) => {
      return h('div', { class: 'text-center' }, row.getValue('priceType') === '1' ? '魔晶' : '金幣')
    },
  },
  {
    accessorKey: 'stallName',
    header: '攤位名稱',
    cell: ({ row }) => {
      return h('div', { class: 'text-center' }, row.getValue('stallName') as string)
    },
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
            hour12: false 
          }).replace(/\//g, '-')
        : ''
      
      return h('div', { class: 'flex justify-center' }, [
        h(TooltipProvider, {}, () =>
          h(Tooltip, {}, () => [
            h(TooltipTrigger, { class: 'cursor-pointer' }, () => timeText),
            h(TooltipContent, {}, () => fullDate),
          ])
        )
      ])
    },
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => {
      const payment = row.original
      return h('div', { class: 'text-center' }, [
        h(
          ShadButton,
          {
            size: 'sm',
            variant: 'secondary',
            onClick: () => addTracked(payment),
          },
          () => '追蹤'
        ),
      ])
    },
  },
]

/**
 * 構建商品圖片 URL
 */
function buildImageUrl(type: 'item' | 'pet', iconId: string): string {
  const baseUrl = 'https://member.starcg.net/metamo'
  if (type === 'item') {
    return `${baseUrl}/item/${iconId}.gif`
  }
  return `${baseUrl}/pet/PetHead/${iconId}.png`
}

/**
 * 處理圖片加載失敗的降級策略
 */
function handleImageError(event: Event, iconId: string): void {
  const target = event.target as HTMLImageElement
  const fallbackUrl = `https://member.starcg.net/metamo/png/${iconId}.png`
  const defaultUrl = 'https://member.starcg.net/metamo/png/97004.png'

  // 如果還沒有用過降級 URL，先試試
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl
  }
  // 如果降級也失敗了，用預設圖片
  else if (target.src !== defaultUrl) {
    target.src = defaultUrl
  }
}
