#!/usr/bin/env node
// Renders the PWA icons from the design system's app icon (Design system · 01 Mark & icon):
// the glass-and-nose mark, filled with wine, on a butter-yellow tile.
// Usage: node scripts/make-icons.mjs   (writes public/icons/*; uses Playwright's Chromium)
import { chromium } from '@playwright/test'
import { writeFileSync } from 'node:fs'

const MARK = `
  <path d="M13 30 H50.4 C50.2 47 43 58 32 58 C25 58 20.3 53 18.2 45 C17 45.8 15.5 46.8 13 46.5 C9 46 7.5 42 9.5 38 C10.8 35.5 12 32.8 13 30 Z" fill="#7E1F35" stroke="none"/>
  <path d="M23 5 C21 16 14 29 9.5 38 C7.5 42 9 46 13 46.5 C15.5 46.8 17 45.8 18.2 45 C20 52.5 25 58 32 58 C43 58 50.5 48 50.5 33 C50.5 22 48.5 12 46.5 5"/>
  <path d="M32 58 V86 M21 88 C26 86.5 38 86.5 43 88"/>`
// The design's 132 px tile holds the mark at 60 × 90 (viewBox 64 × 96), centred.
const mark = `<g transform="translate(36 21) scale(0.9375)" fill="none" stroke="#1E1416" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">${MARK}</g>`
const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132 132"><rect x="0.75" y="0.75" width="130.5" height="130.5" rx="30" fill="#F2CF5B" stroke="#1E1416" stroke-width="1.5"/>${mark}</svg>`
// Maskable: full bleed, so launchers can apply their own shape; the mark sits inside the safe zone.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132 132"><rect width="132" height="132" fill="#F2CF5B"/>${mark}</svg>`

writeFileSync('public/icons/icon.svg', tile + '\n')
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, svg, size, transparent] of [
  ['icon-192.png', tile, 192, true], ['icon-512.png', tile, 512, true],
  ['maskable-512.png', maskable, 512, false], ['apple-touch-icon.png', maskable, 180, false],
]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}`)
  await page.locator('svg').screenshot({ path: `public/icons/${name}`, omitBackground: transparent })
  console.log('wrote', name)
}
await browser.close()
