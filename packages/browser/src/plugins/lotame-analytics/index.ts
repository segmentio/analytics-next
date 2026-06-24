import { PluginType } from '@segment/analytics-core'
import type { Analytics } from '../../core/analytics'
import type { Context } from '../../core/context'
import type { Plugin } from '../../core/plugin'
import {
  CookieStorage,
  LocalStorage,
  MemoryStorage,
  UniversalStorage,
} from '../../core/storage'
import { tld } from '../../core/user/tld'
import { loadScript } from '../../lib/load-script'

const EVENT_NAME = 'Lotame Enhanced Profile'
const DEFAULT_TTL_DAYS = 7
const DEFAULT_COOKIE_NAME = 'lotame_profile'
const DEFAULT_TRAITS_NAMESPACE = 'lotame'
const DEFAULT_CAPTURE_TIMEOUT_MS = 10_000
const PRECONNECT_ORIGINS = [
  'https://tags.crwdcntrl.net',
  'https://bcp.crwdcntrl.net',
  'https://c.ltmsphrcl.net',
] as const

type Audience = unknown

export interface LotameProfile {
  audiences: Audience[]
  panoramaId: string
  capturedAt: string
}

export interface LotameAnalyticsConfig {
  clientId: string
  ttlDays?: number
  cookieName?: string
  traitsNamespace?: string
  captureTimeoutMs?: number
}

type LotameStorage = Record<string, LotameProfile>

interface LotameNativeProfile {
  getAudiences?: () => Audience[]
  getPanorama?: () => {
    getId?: () => string
  }
}

interface LotameWindow extends Window {
  [key: string]: unknown
}

const captureFlights: Record<string, Promise<LotameProfile> | undefined> = {}

const millisecondsInDay = 24 * 60 * 60 * 1000

function buildStorage(ttlDays: number) {
  const domain = tld(window.location.href)
  const cookie = new CookieStorage<LotameStorage>({
    domain,
    maxage: ttlDays,
    path: '/',
    sameSite: 'Lax',
  })

  return new UniversalStorage<LotameStorage>([
    cookie,
    new LocalStorage(),
    new MemoryStorage(),
  ])
}

function validProfile(profile: LotameProfile | null, ttlDays: number) {
  if (!profile || !Array.isArray(profile.audiences) || !profile.capturedAt) {
    return null
  }

  const capturedAt = Date.parse(profile.capturedAt)
  if (!Number.isFinite(capturedAt)) {
    return null
  }

  if (Date.now() - capturedAt > ttlDays * millisecondsInDay) {
    return null
  }

  return profile
}

function extractProfile(profile: LotameNativeProfile): LotameProfile {
  const audiences = profile.getAudiences?.() ?? []
  const panoramaId = profile.getPanorama?.()?.getId?.() ?? ''

  return {
    audiences: Array.isArray(audiences) ? audiences : [],
    panoramaId,
    capturedAt: new Date().toISOString(),
  }
}

function getNativeNamespace(clientId: string) {
  return `lotame_${clientId}`
}

function injectPreconnectHints(): void {
  const head = document.head
  if (!head) {
    return
  }

  for (const origin of PRECONNECT_ORIGINS) {
    const existing = head.querySelector(
      `link[rel="preconnect"][href="${origin}"], link[rel="dns-prefetch"][href="${origin}"]`
    )
    if (existing) {
      continue
    }

    const preconnect = document.createElement('link')
    preconnect.rel = 'preconnect'
    preconnect.href = origin
    preconnect.crossOrigin = 'anonymous'
    head.appendChild(preconnect)

    const dnsPrefetch = document.createElement('link')
    dnsPrefetch.rel = 'dns-prefetch'
    dnsPrefetch.href = origin
    head.appendChild(dnsPrefetch)
  }
}

export class LotameAnalyticsPlugin implements Plugin {
  name = 'Lotame Analytics'
  type: PluginType = 'enrichment'
  version = '0.1.0'
  isLoaded = () => true

  private readonly clientId: string
  private readonly ttlDays: number
  private readonly cookieName: string
  private readonly traitsNamespace: string
  private readonly captureTimeoutMs: number
  private profile: LotameProfile | null = null
  private storage: UniversalStorage<LotameStorage> | undefined

  constructor(config: LotameAnalyticsConfig) {
    this.clientId = config.clientId
    this.ttlDays = config.ttlDays ?? DEFAULT_TTL_DAYS
    this.cookieName = config.cookieName ?? DEFAULT_COOKIE_NAME
    this.traitsNamespace = config.traitsNamespace ?? DEFAULT_TRAITS_NAMESPACE
    this.captureTimeoutMs =
      config.captureTimeoutMs ?? DEFAULT_CAPTURE_TIMEOUT_MS
  }

  load = (_ctx: Context, instance: Analytics): Promise<void> => {
    if (!this.clientId) {
      console.warn('Lotame Analytics: clientId is required')
      return Promise.resolve()
    }

    this.storage = buildStorage(this.ttlDays)
    this.profile = validProfile(this.storage.get(this.cookieName), this.ttlDays)

    if (this.profile) {
      return Promise.resolve()
    }

    injectPreconnectHints()

    const flightKey = `${this.cookieName}:${this.clientId}`
    if (!captureFlights[flightKey]) {
      captureFlights[flightKey] = this.capture(instance).finally(() => {
        captureFlights[flightKey] = undefined
      })
    }

    void captureFlights[flightKey]
      ?.then((profile) => {
        this.profile = profile
      })
      .catch(() => undefined)

    return Promise.resolve()
  }

  private capture(instance: Analytics): Promise<LotameProfile> {
    const timeoutMs = this.captureTimeoutMs

    return new Promise<LotameProfile>((resolve, reject) => {
      let settled = false
      const done = (fn: () => void) => {
        if (!settled) {
          settled = true
          fn()
        }
      }

      const timer = setTimeout(() => {
        done(() =>
          reject(
            new Error(
              `Lotame capture timed out after ${timeoutMs}ms — no onProfileReady callback`
            )
          )
        )
      }, timeoutMs)

      const namespace = getNativeNamespace(this.clientId)
      const win = window as unknown as LotameWindow
      const existing = (win[namespace] ?? {}) as Record<string, unknown>
      const config = (existing.config ?? {}) as Record<string, unknown>

      win[namespace] = {
        ...existing,
        config: {
          ...config,
          onProfileReady: (lotameProfile: LotameNativeProfile) => {
            done(() => {
              clearTimeout(timer)
              try {
                const profile = extractProfile(lotameProfile)
                this.profile = profile
                this.storage?.set(this.cookieName, profile)
                void instance.track(EVENT_NAME, profile).catch(() => undefined)
                resolve(profile)
              } catch (err) {
                reject(err)
              }
            })
          },
        },
        data: existing.data ?? {},
        cmd: existing.cmd ?? [],
      }

      loadScript(`https://tags.crwdcntrl.net/lt/c/${this.clientId}/lt.min.js`)
        .then(() => undefined)
        .catch((err) => {
          done(() => {
            clearTimeout(timer)
            reject(err)
          })
        })
    })
  }

  private enrich = (ctx: Context): Context => {
    if (!this.profile) {
      return ctx
    }

    const eventContext = ctx.event.context ?? {}
    eventContext.traits = {
      ...eventContext.traits,
      [this.traitsNamespace]: this.profile,
    }
    ctx.event.context = eventContext

    return ctx
  }

  track = this.enrich
  identify = this.enrich
  page = this.enrich
  group = this.enrich
  alias = this.enrich
  screen = this.enrich
}

export function lotameAnalytics(
  config: LotameAnalyticsConfig
): LotameAnalyticsPlugin {
  return new LotameAnalyticsPlugin(config)
}
