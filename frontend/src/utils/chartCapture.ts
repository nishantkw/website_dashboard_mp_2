import { toPng } from 'html-to-image'

export interface CapturedVisual {
  title: string
  dataUrl: string
}

function isExportUi(node: HTMLElement) {
  return node.dataset?.noExport === 'true' || node.closest?.('[data-no-export="true"]') != null
}

/** Snapshot on-screen KPI cards and graphs as PNG (same look as the dashboard). */
export async function captureExportVisuals(matchTitle?: string): Promise<CapturedVisual[]> {
  const nodes = [...document.querySelectorAll<HTMLElement>('[data-export-visual]')]
  const out: CapturedVisual[] = []

  for (const el of nodes) {
    const title = (el.getAttribute('data-export-visual') || 'Chart').trim()
    if (matchTitle && title.toLowerCase() !== matchTitle.toLowerCase()) continue
    const rect = el.getBoundingClientRect()
    if (rect.width < 8 || rect.height < 8) continue
    try {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      const dataUrl = await toPng(el, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true
          return !isExportUi(node)
        },
      })
      if (dataUrl) out.push({ title, dataUrl })
    } catch (err) {
      console.warn(`[export] could not capture "${title}"`, err)
    }
  }

  return out
}
