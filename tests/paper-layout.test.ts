import { describe, expect, it } from 'vitest'
import { getPdfScale } from '../utils/paper-layout'

describe('PDF page sizing', () => {
  it.each([198, 253, 374, 824])('fits a page into %ipx of usable space', (width) => {
    for (const pageWidth of [595, 612, 842]) {
      expect(Math.round(pageWidth * getPdfScale(pageWidth, width))).toBeLessThanOrEqual(width)
    }
  })

  it('keeps the existing desktop enlargement limit', () => {
    expect(getPdfScale(612, 2000)).toBe(1.25)
  })
})
