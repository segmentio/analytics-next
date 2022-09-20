import { validateSettings } from '../app/settings'

describe('validateSettings', () => {
  it('should throw an error if no write key', () => {
    expect(() => validateSettings({ writeKey: undefined as any })).toThrowError(
      /writeKey/i
    )
  })
})
