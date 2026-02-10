import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import ShadBadge from '@/components/shadcn/Badge.vue'
import ShadButton from '@/components/shadcn/Button.vue'
import { ArrowUpDown } from 'lucide-vue-next'
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
          startTime,
          iconId: String(item.ITEM_BASEIMAGENUMBER ?? ''),
        })
      }
    }

    // 添加寵物行
    if (cdKey && petsByCd?.[cdKey]) {
      for (const pet of petsByCd[cdKey]) {
        const petName = String(pet.UserPetName || pet.Name || pet.petName || '')
        const level = String(pet.Lv ?? '')
        const name = level ? `${petName} (Lv${level})` : petName

        out.push({
          type: 'pet',
          name,
          price: Number(pet.price ?? 0),
          priceType: String(pet.pricetype ?? '0') as '0' | '1',
          stallName,
          server,
          coords,
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
export const columns = (addTracked: (payment: Payment) => void): ColumnDef<Payment>[] => [
  {
    accessorKey: 'type',
    header: '類型',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const variant = type === 'item' ? 'secondary' : 'default'
      const text = type === 'item' ? '道具' : '寵物'
      return h(ShadBadge, { variant }, () => text)
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
      return h(
        ShadButton,
        {
          variant: 'ghost',
          onClick: (e: Event) => {
            e.stopPropagation();
            column.toggleSorting(column.getIsSorted() === 'asc');
          },
        },
        () =>
          h('span', { class: 'flex items-center' }, [
            '價格',
            h(ArrowUpDown, { class: 'ml-2 h-4 w-4' }),
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
      return row.getValue('priceType') === '1' ? '魔晶' : '金幣'
    },
  },
  {
    accessorKey: 'stallName',
    header: '攤位名稱',
  },
  {
    accessorKey: 'server',
    header: '伺服器/座標',
    cell: ({ row }) => {
      return `${row.original.server} / ${row.original.coords}`
    },
  },
  {
    accessorKey: 'startTime',
    header: '攤位到期時間',
    cell: ({ row }) => {
      const timestamp = row.getValue('startTime') as string
      return getTimeUntilExpiration(timestamp)
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const payment = row.original
      return h(
        ShadButton,
        {
          size: 'sm',
          variant: 'secondary',
          onClick: () => addTracked(payment),
        },
        () => '追蹤'
      )
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
