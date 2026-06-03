import type { DebugInfo } from '../types'

const PANEL_ID = 'bg-analytics-debug-panel'

export function copyToClipboard(content: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(content)
  }
  return Promise.resolve()
}

export function mountDebugPanel(getInfo: () => DebugInfo): void {
  if (typeof document === 'undefined') {
    return
  }

  const existing = document.getElementById(PANEL_ID)
  if (existing) {
    return
  }

  const panel = document.createElement('div')
  panel.id = PANEL_ID
  panel.style.position = 'fixed'
  panel.style.bottom = '16px'
  panel.style.right = '16px'
  panel.style.zIndex = '99999'
  panel.style.padding = '10px'
  panel.style.background = '#111827'
  panel.style.color = '#f9fafb'
  panel.style.borderRadius = '8px'
  panel.style.font = '12px monospace'
  panel.style.maxWidth = '320px'
  panel.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'

  const title = document.createElement('div')
  title.textContent = 'Bg Analytics Debug'
  title.style.fontWeight = '700'
  title.style.marginBottom = '8px'

  const pre = document.createElement('pre')
  pre.style.margin = '0 0 8px 0'
  pre.style.whiteSpace = 'pre-wrap'

  const copyButton = document.createElement('button')
  copyButton.textContent = 'Copy debug JSON'
  copyButton.style.width = '100%'
  copyButton.style.border = '1px solid #374151'
  copyButton.style.background = '#1f2937'
  copyButton.style.color = '#f9fafb'
  copyButton.style.padding = '6px 8px'
  copyButton.style.borderRadius = '6px'
  copyButton.style.cursor = 'pointer'

  const render = (): void => {
    pre.textContent = JSON.stringify(getInfo(), null, 2)
  }

  copyButton.addEventListener('click', async () => {
    await copyToClipboard(JSON.stringify(getInfo(), null, 2))
    copyButton.textContent = 'Copied!'
    setTimeout(() => {
      copyButton.textContent = 'Copy debug JSON'
    }, 1200)
  })

  panel.appendChild(title)
  panel.appendChild(pre)
  panel.appendChild(copyButton)
  document.body.appendChild(panel)
  render()

  setInterval(render, 1000)
}
