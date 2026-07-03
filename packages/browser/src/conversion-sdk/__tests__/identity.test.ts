import { sha256Hex } from '../../plugins/conversion-collector/identify/sha256'
import { deriveUserIdFromTraits, withOriginMarkers } from '../identity'

describe('deriveUserIdFromTraits', () => {
  it('derives user_id from SHA-256(trim(lowercase(email))) when no BGID trait is present', async () => {
    const expected = await sha256Hex('user@example.com')

    const userId = await deriveUserIdFromTraits({
      email: '  User@Example.COM ',
    })

    expect(userId).toBe(expected)
    expect(userId).toMatch(/^[a-f0-9]{64}$/)
  })

  it('resolves the same user_id for the same email regardless of casing/whitespace (cross-device)', async () => {
    const deviceA = await deriveUserIdFromTraits({ email: 'user@example.com' })
    const deviceB = await deriveUserIdFromTraits({
      email: '  USER@EXAMPLE.COM',
    })

    expect(deviceA).toBe(deviceB)
  })

  it('prefers an explicit BGID trait over deriving from email', async () => {
    const userId = await deriveUserIdFromTraits({
      bgid: 'bgid-from-arbgid-123',
      email: 'user@example.com',
    })

    expect(userId).toBe('bgid-from-arbgid-123')
  })

  it('does not re-hash an email trait that is already SHA-256 hex', async () => {
    const existing = 'a'.repeat(64)
    const userId = await deriveUserIdFromTraits({ email: existing })
    expect(userId).toBe(existing)
  })

  it('returns undefined when there is no BGID and no email', async () => {
    const userId = await deriveUserIdFromTraits({ name: 'Maria' })
    expect(userId).toBeUndefined()
  })
})

describe('withOriginMarkers', () => {
  it('tags traits with traits.navec identifying the SDK as the source', () => {
    const traits = withOriginMarkers({ email: 'user@example.com' }, {})

    expect(traits.navec).toEqual({ source: 'conversion-pipeline-sdk' })
  })

  it('honors a configured navecSource override', () => {
    const traits = withOriginMarkers({}, { navecSource: 'quiz-model-5' })
    expect(traits.navec).toEqual({ source: 'quiz-model-5' })
  })

  it('does not overwrite a navec marker the caller already set', () => {
    const traits = withOriginMarkers({ navec: { source: 'custom' } }, {})
    expect(traits.navec).toEqual({ source: 'custom' })
  })

  it('adds a lotame marker when lotameClientId is configured', () => {
    const traits = withOriginMarkers({}, { lotameClientId: 'lotame-123' })
    expect(traits.lotame).toEqual({ source: 'lotame', clientId: 'lotame-123' })
  })

  it('omits the lotame marker when lotame is not configured', () => {
    const traits = withOriginMarkers({}, {})
    expect(traits.lotame).toBeUndefined()
  })
})
