import {
  isSha256Hex,
  sha256Hex,
} from '../plugins/conversion-collector/identify/sha256'
import type { AnalyticsInitConfig } from './types'

const BGID_TRAIT_KEYS = ['bgid', 'bgId', 'BGID'] as const
const DEFAULT_NAVEC_SOURCE = 'conversion-pipeline-sdk'

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * user_id = BGID (trait already resolved by the host, e.g. arbgid.com.br) when present,
 * else SHA-256(trim(lowercase(email))) — no secret, deterministic across devices.
 * Only used as a fallback when the caller does not pass an explicit userId to identify().
 */
export function deriveUserIdFromTraits(
  traits: Record<string, unknown>
): Promise<string | undefined> {
  for (const key of BGID_TRAIT_KEYS) {
    const bgid = asNonEmptyString(traits[key])
    if (bgid) {
      return Promise.resolve(bgid)
    }
  }

  const rawEmail =
    asNonEmptyString(traits.email) ?? asNonEmptyString(traits.email_hash)
  if (!rawEmail) {
    return Promise.resolve(undefined)
  }
  const normalized = rawEmail.toLowerCase()
  if (isSha256Hex(normalized)) {
    return Promise.resolve(normalized)
  }
  return sha256Hex(normalized).then((hash) => hash || undefined)
}

/**
 * Tags identify traits with the data source (navec, + lotame when configured) so
 * downstream consumers (ClickHouse) can tell where the identity data came from.
 * Exact schema is a placeholder — `{ source }` — pending confirmation with the
 * requester; callers can override by passing traits.navec / traits.lotame explicitly.
 */
export function withOriginMarkers(
  traits: Record<string, unknown>,
  config: Pick<AnalyticsInitConfig, 'navecSource' | 'lotameClientId'>
): Record<string, unknown> {
  const out = Object.assign({}, traits)

  if (out.navec == null) {
    out.navec = { source: config.navecSource ?? DEFAULT_NAVEC_SOURCE }
  }

  if (config.lotameClientId && out.lotame == null) {
    out.lotame = { source: 'lotame', clientId: config.lotameClientId }
  }

  return out
}
