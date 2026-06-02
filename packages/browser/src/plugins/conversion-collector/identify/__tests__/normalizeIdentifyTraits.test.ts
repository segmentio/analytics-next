import { normalizeIdentifyTraits } from '../normalizeIdentifyTraits'
import { sha256Hex } from '../sha256'
import { normalizePhoneToE164 } from '../phone'

describe('normalizeIdentifyTraits', () => {
  it('hashes email (lowercase + trim) and keeps email_domain open', async () => {
    const email = '  Test@Example.COM '
    const expectedEmailHash = await sha256Hex('test@example.com')

    const traits = await normalizeIdentifyTraits({
      email,
      name: 'Maria',
    })

    expect(traits.email).toBe(expectedEmailHash)
    expect(String(traits.email)).toMatch(/^[a-f0-9]{64}$/)
    expect(traits.email).toBe(traits.email_hash)
    expect(traits.email_domain).toBe('example.com')
    expect(String(traits.name)).toMatch(/^[a-f0-9]{64}$/)
    expect(traits.name).not.toBe('Maria')
  })

  it('hashes phone after E.164 normalization', async () => {
    const e164 = normalizePhoneToE164('(11) 98765-4321')
    const expectedPhoneHash = await sha256Hex(e164)

    const traits = await normalizeIdentifyTraits({
      phone: '(11) 98765-4321',
    })

    expect(traits.phone).toBe(expectedPhoneHash)
    expect(traits.phone).toBe(traits.phone_hash)
    expect(String(traits.phone)).toMatch(/^[a-f0-9]{64}$/)
  })

  it('does not re-hash values that are already SHA-256 hex', async () => {
    const existing = 'a'.repeat(64)
    const traits = await normalizeIdentifyTraits({
      email: existing,
      phone: existing,
    })
    expect(traits.email).toBe(existing)
    expect(traits.phone).toBe(existing)
  })
})
