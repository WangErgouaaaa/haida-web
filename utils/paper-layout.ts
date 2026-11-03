export function getPdfScale(pageWidth: number, availableWidth: number): number {
  return Math.min(1.25, Math.max(1, availableWidth) / pageWidth)
}
