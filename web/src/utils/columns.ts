import type { MarketApiResponse, Payment } from '../types/market'

export function buildRowsFromApi(apiResponse: MarketApiResponse): Payment[] {
  const out: Payment[] = []
  const { stalls, itemsByCd, petsByCd } = apiResponse

  for (const stall of stalls) {
    const cdKey = stall.cdkey ?? stall.cdKey ?? stall.cd ?? stall.CDKEY ?? ''
    const stallName = String(stall.name ?? stall.stall_name ?? stall.storename ?? '')
    const server = String(stall.server ?? stall.server_name ?? '')
    const coords = stall.coords ?? `${stall.X ?? stall.x ?? ''},${stall.Y ?? stall.y ?? ''}`
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
        const petName = String(pet.UserPetName || pet.Name || pet.petName || '')
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
