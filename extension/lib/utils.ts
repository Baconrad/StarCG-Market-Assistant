/**
 * 工具函數 - 用於 UI 組件（如 shadcn）
 * 主要用於 CSS 類名合併
 */

/**
 * 合併 CSS 類名
 * 支持條件類名和去除重複
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes
    .filter(Boolean)
    .join(' ')
    .trim();
}
