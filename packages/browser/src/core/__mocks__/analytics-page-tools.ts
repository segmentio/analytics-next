export type PageContext = Record<string, unknown>
export type BufferedPageContext = PageContext

export const BufferedPageContextDiscriminant = 'buffered' as const

export function getDefaultPageContext(): PageContext {
  return {}
}

export function getDefaultBufferedPageContext(): BufferedPageContext {
  return {}
}

export function createPageContext(ctx: Partial<PageContext> = {}): PageContext {
  return { ...ctx }
}

export function createBufferedPageContext(
  ctx: Partial<BufferedPageContext> = {}
): BufferedPageContext {
  return { ...ctx }
}

export function isBufferedPageContext(
  _ctx: unknown
): _ctx is BufferedPageContext {
  return false
}
