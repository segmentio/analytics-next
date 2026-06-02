import { PluginType } from '@segment/analytics-core'
import { Analytics } from '../../core/analytics'
import { Plugin } from '../../core/plugin'

type TrackFn = (
  eventName: string,
  properties: Record<string, unknown>
) => void | Promise<void>

type GptResponseInfo = {
  advertiserId?: number | string
  campaignId?: number | string
  creativeId?: number | string
  lineItemId?: number | string
  isBackfill?: boolean
}

type GptSlotLike = {
  getSlotElementId?: () => string
  getAdUnitPath?: () => string
  getResponseInformation?: () => GptResponseInfo | null
}

type GptPubAdsEvent = {
  slot?: GptSlotLike
  isEmpty?: boolean
  isBackfill?: boolean
  size?: number[] | string
  creativeId?: number | string
  lineItemId?: number | string
  advertiserId?: number | string
}

type GoogletagApi = {
  cmd?: Array<() => void>
  pubads?: () => {
    addEventListener: (
      eventType: string,
      listener: (event: GptPubAdsEvent) => void
    ) => void
  }
}

export const CANONICAL_GPT_EVENTS = [
  'slotRequested',
  'slotResponseReceived',
  'slotRenderEnded',
  'slotOnload',
  'impressionViewable',
  'slotEmpty',
] as const

function getGoogletag(
  windowRef: Window & { googletag?: GoogletagApi }
): GoogletagApi | undefined {
  return windowRef.googletag
}

function getSlotTopOffset(slotElementId: string): number | undefined {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return undefined
  }

  const element = document.getElementById(slotElementId)
  if (!element) {
    return undefined
  }

  const rect = element.getBoundingClientRect()
  return Math.round(rect.top + window.scrollY)
}

function getScrollDepthPct(): number | undefined {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return undefined
  }

  const scrollHeight =
    document.documentElement.scrollHeight - window.innerHeight
  if (scrollHeight <= 0) {
    return 0
  }

  return Math.round((window.scrollY / scrollHeight) * 100)
}

function assignSizeRendered(
  props: Record<string, unknown>,
  size: number[] | string | undefined
): void {
  if (Array.isArray(size) && size.length >= 2) {
    props.width = size[0]
    props.height = size[1]
    props.size_rendered = `${size[0]}x${size[1]}`
    return
  }

  if (typeof size === 'string' && size.length > 0) {
    props.size_rendered = size
  }
}

function mapGptSlotProperties(
  event: GptPubAdsEvent,
  eventName: typeof CANONICAL_GPT_EVENTS[number]
): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  const slot = event.slot
  const responseInfo = slot?.getResponseInformation?.() ?? null

  const slotElementId = slot?.getSlotElementId?.()
  if (slotElementId) {
    props.slot_element_id = slotElementId
    props.slot_id = slotElementId
    const slotTopOffset = getSlotTopOffset(slotElementId)
    if (slotTopOffset !== undefined) {
      props.slot_top_offset = slotTopOffset
    }
  }

  const adUnitPath = slot?.getAdUnitPath?.()
  if (adUnitPath) {
    props.ad_unit_path = adUnitPath
  }

  if (typeof event.isEmpty === 'boolean') {
    props.is_empty = event.isEmpty
  }

  const isBackfill =
    typeof event.isBackfill === 'boolean'
      ? event.isBackfill
      : responseInfo?.isBackfill
  if (typeof isBackfill === 'boolean') {
    props.is_backfill = isBackfill
  }

  assignSizeRendered(props, event.size)

  const creativeId = event.creativeId ?? responseInfo?.creativeId
  if (creativeId !== undefined && creativeId !== '') {
    props.creative_id = creativeId
  }

  const lineItemId = event.lineItemId ?? responseInfo?.lineItemId
  if (lineItemId !== undefined && lineItemId !== '') {
    props.line_item_id = lineItemId
  }

  const advertiserId = event.advertiserId ?? responseInfo?.advertiserId
  if (advertiserId !== undefined && advertiserId !== '') {
    props.advertiser_id = advertiserId
  }

  props.event_timestamp_ms = Date.now()

  if (eventName === 'slotRenderEnded' && typeof window !== 'undefined') {
    props.scroll_y_at_render = window.scrollY
    props.slot_visible_on_render = !event.isEmpty
  }

  if (eventName === 'impressionViewable') {
    const scrollDepth = getScrollDepthPct()
    if (scrollDepth !== undefined) {
      props.scroll_depth = scrollDepth
    }
  }

  if (eventName === 'slotEmpty' && event.isEmpty) {
    props.reason = 'empty_response'
  }

  return props
}

function installListeners(track: TrackFn, googletag: GoogletagApi): void {
  const pubads = googletag.pubads?.()
  if (!pubads) {
    return
  }

  for (const eventName of CANONICAL_GPT_EVENTS) {
    pubads.addEventListener(eventName, (event) => {
      const properties = mapGptSlotProperties(event, eventName)
      void track(eventName, properties)
    })
  }
}

export type MountGptSlotEventListenersOptions = {
  enabled?: boolean
}

export function mountGptSlotEventListeners(
  track: TrackFn,
  options: MountGptSlotEventListenersOptions = {}
): void {
  if (typeof window === 'undefined') {
    return
  }

  if (options.enabled === false) {
    return
  }

  const w = window as Window & { googletag?: GoogletagApi }

  const run = () => {
    const api = getGoogletag(w)
    if (!api) {
      return
    }
    installListeners(track, api)
  }

  if (!w.googletag) {
    w.googletag = { cmd: [] }
  } else if (!w.googletag.cmd) {
    w.googletag.cmd = []
  }

  w.googletag.cmd!.push(run)
}

export function conversionGptSlotEventsPlugin(
  options: MountGptSlotEventListenersOptions = {}
): Plugin {
  return {
    name: 'Conversion GPT Slot Events',
    type: 'utility' as PluginType,
    version: '0.1.0',
    isLoaded: () => true,
    load: (_ctx, instance) => {
      const analytics = instance as Analytics
      mountGptSlotEventListeners((eventName, properties) => {
        void analytics.track(eventName, properties)
      }, options)
      return Promise.resolve()
    },
  }
}
