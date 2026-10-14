import { parseStoredValue } from '../parseStoredValue'

describe('parseStoredValue', () => {
  it.each([
    ['{"a":1}', { a: 1 }],
    ['[1,2]', [1, 2]],
    ['true', true],
    ['"quoted"', 'quoted'],
    ['null', null],
    ['12345', 12345],
    ['-5', -5],
    ['0.1', 0.1],
  ])('parses %s as JSON', (raw, expected) => {
    expect(parseStoredValue(raw)).toStrictEqual(expected)
  })

  it.each([
    'not json',
    '7689174720735493772',
    '123456789012345678901234567890',
    '1e3',
    '1.0',
    '-0',
    ' 12',
  ])('returns the raw string for %s', (raw) => {
    expect(parseStoredValue(raw)).toBe(raw)
  })
})
