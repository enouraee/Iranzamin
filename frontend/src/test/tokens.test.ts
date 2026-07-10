import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const colorsPath = resolve(__dirname, '../styles/tokens/colors.css')
const stylesPath = resolve(__dirname, '../styles/styles.css')

describe('design tokens', () => {
  it('colors.css contains --color-primary semantic alias', () => {
    const css = readFileSync(colorsPath, 'utf-8')
    expect(css).toContain('--color-primary')
  })

  it('colors.css maps --blue-600 to #1F4A6B (primary brand color)', () => {
    const css = readFileSync(colorsPath, 'utf-8')
    expect(css).toContain('#1F4A6B')
  })

  it('styles.css imports all token files', () => {
    const css = readFileSync(stylesPath, 'utf-8')
    expect(css).toContain('./tokens/colors.css')
    expect(css).toContain('./tokens/fonts.css')
    expect(css).toContain('./tokens/typography.css')
    expect(css).toContain('./tokens/spacing.css')
    expect(css).toContain('./tokens/radius.css')
    expect(css).toContain('./tokens/shadows.css')
    expect(css).toContain('./tokens/base.css')
  })
})
