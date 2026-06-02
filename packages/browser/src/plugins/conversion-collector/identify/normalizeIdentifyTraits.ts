import { isSha256Hex, sha256Hex } from './sha256'
import { normalizePhoneToE164 } from './phone'

const PHONE_TRAIT_KEYS = ['phone', 'whatsapp', 'telefone', 'mobile'] as const
const NAME_TRAIT_KEYS = ['name'] as const

export type NormalizeIdentifyTraitsOptions = {
  defaultPhoneCountryCode?: string
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function extractEmailDomain(email: string): string | undefined {
  const at = email.indexOf('@')
  if (at < 0) {
    return undefined
  }
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase()
  return domain.length > 0 ? domain : undefined
}

async function hashEmailTrait(rawEmail: string): Promise<string> {
  const normalized = rawEmail.trim().toLowerCase()
  if (!normalized) {
    return ''
  }
  if (isSha256Hex(normalized)) {
    return normalized.toLowerCase()
  }
  return sha256Hex(normalized)
}

async function hashPhoneTrait(
  rawPhone: string,
  defaultCountryCode: string
): Promise<string> {
  const trimmed = rawPhone.trim()
  if (!trimmed) {
    return ''
  }
  if (isSha256Hex(trimmed)) {
    return trimmed.toLowerCase()
  }
  const e164 = normalizePhoneToE164(trimmed, defaultCountryCode)
  if (!e164) {
    return ''
  }
  return sha256Hex(e164)
}

async function hashNameTrait(rawName: string): Promise<string> {
  const trimmed = rawName.trim()
  if (!trimmed) {
    return ''
  }
  if (isSha256Hex(trimmed)) {
    return trimmed.toLowerCase()
  }
  return sha256Hex(trimmed.toLowerCase())
}

export async function normalizeIdentifyTraits(
  traits: Record<string, unknown>,
  options: NormalizeIdentifyTraitsOptions = {}
): Promise<Record<string, unknown>> {
  const defaultPhoneCountryCode = options.defaultPhoneCountryCode ?? '55'
  const out: Record<string, unknown> = { ...traits }

  const rawEmail = asNonEmptyString(traits.email)
  if (rawEmail) {
    const domainFromEmail = extractEmailDomain(rawEmail)
    const hashedEmail = await hashEmailTrait(rawEmail)
    if (hashedEmail) {
      out.email = hashedEmail
      out.email_hash = hashedEmail
    }
    if (domainFromEmail && out.email_domain == null) {
      out.email_domain = domainFromEmail
    }
  }

  const explicitDomain = asNonEmptyString(traits.email_domain)
  if (explicitDomain) {
    out.email_domain = explicitDomain.toLowerCase()
  }

  for (const key of PHONE_TRAIT_KEYS) {
    const rawPhone = asNonEmptyString(traits[key])
    if (!rawPhone) {
      continue
    }
    const hashedPhone = await hashPhoneTrait(rawPhone, defaultPhoneCountryCode)
    if (hashedPhone) {
      out[key] = hashedPhone
      if (key === 'phone' || out.phone_hash == null) {
        out.phone_hash = hashedPhone
      }
    }
  }

  for (const key of NAME_TRAIT_KEYS) {
    const rawName = asNonEmptyString(traits[key])
    if (!rawName) {
      continue
    }
    const hashedName = await hashNameTrait(rawName)
    if (hashedName) {
      out[key] = hashedName
    }
  }

  return out
}
