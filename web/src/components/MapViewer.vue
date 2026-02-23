<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  x: number
  y: number
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
// 使用 ref 儲存 Image 對象，確保響應式環境下的一致性
const img = new Image()

/**
 * 遊戲座標轉換為像素座標 (保持你原本完美的公式)
 */
function gameToPixel(gx: number, gy: number) {
  const refGX = 248
  const refGY = 88
  const refPX = 710.9
  const refPY = 133.1

  const dgX = gx - refGX
  const dgY = gy - refGY

  const ux_px = 2.6285
  const ux_py = -1.9188
  const uy_px = 2.6285
  const uy_py = 1.9188

  const px = refPX + dgX * ux_px + dgY * uy_px
  const py = refPY + dgX * ux_py + dgY * uy_py

  return { x: px, y: py }
}

/**
 * 繪製地圖標記
 */
function drawMarker() {
  const canvas = canvasRef.value
  if (!canvas || !img.complete || img.naturalWidth === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 確保畫布尺寸與圖片原始尺寸同步
  if (canvas.width !== img.width || canvas.height !== img.height) {
    canvas.width = img.width
    canvas.height = img.height
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)
  
  const pos = gameToPixel(props.x, props.y)

  // 繪製紅點
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2)
  ctx.fillStyle = 'red'
  ctx.fill()
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 3
  ctx.stroke()

  // 顯示資訊 (添加文字陰影提升清晰度)
  ctx.shadowColor = 'black'
  ctx.shadowBlur = 4
  ctx.fillStyle = 'white'
  ctx.font = 'bold 24px Arial'
  ctx.fillText(`${props.x}, ${props.y}`, pos.x + 15, pos.y + 5)
  ctx.shadowBlur = 0 // 重置陰影免得影響後續繪製
}

/**
 * 監聽座標變化並重繪
 */
watch([() => props.x, () => props.y], () => {
  drawMarker()
}, { immediate: false })

onMounted(() => {
  img.onload = () => {
    drawMarker()
  }
  // 注意：請確保路徑與 public 資料夾中的檔案名稱一致
  img.src = './map.png'
})
</script>

<template>
  <div class="map-viewer">
    <!-- 移除固定高度，讓 CSS 控制顯示，但 Canvas 內部保持原始解析度 -->
    <canvas ref="canvasRef" class="map-canvas" />
  </div>
</template>

<style scoped>
.map-viewer {
  width: 100%;
  overflow: auto; /* 若圖片太大允許捲動 */
  display: flex;
  justify-content: center;
}

.map-canvas {
  max-width: 100%; /* 響應式縮放，不會破壞 Canvas 內部的像素座標系統 */
  height: auto;
  border: 1px solid #ccc;
}
</style>