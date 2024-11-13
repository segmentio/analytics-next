import { cleanText } from '../dom-gen'

describe(cleanText, () => {
  test('should remove newline characters', () => {
    const input = 'Hello\nWorld\n'
    const expected = 'Hello World'
    expect(cleanText(input)).toBe(expected)
  })

  test('should remove tab characters', () => {
    const input = 'Hello\tWorld\t'
    const expected = 'Hello World'
    expect(cleanText(input)).toBe(expected)
  })

  test('should replace multiple spaces with a single space', () => {
    const input = 'Hello    World'
    const expected = 'Hello World'
    expect(cleanText(input)).toBe(expected)
  })

  test('should replace non-breaking spaces with regular spaces', () => {
    const input = 'Hello\u00A0World'
    const expected = 'Hello World'
    expect(cleanText(input)).toBe(expected)
  })

  test('should trim leading and trailing spaces', () => {
    const input = '   Hello World   '
    const expected = 'Hello World'
    expect(cleanText(input)).toBe(expected)
  })

  test('should handle a combination of special characters', () => {
    const input = ' \n\tHello\u00A0   World\n\t '
    const expected = 'Hello World'
    expect(cleanText(input)).toBe(expected)
  })

  test('should return an empty string if input is empty', () => {
    const input = ''
    const expected = ''
    expect(cleanText(input)).toBe(expected)
  })

  test('should return the same string if there are no special characters', () => {
    const input = 'Hello World'
    const expected = 'Hello World'
    expect(cleanText(input)).toBe(expected)
  })
})
