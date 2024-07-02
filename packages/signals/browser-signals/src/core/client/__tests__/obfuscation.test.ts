import { obfuscateJsonValues } from '../obfuscation'

describe('obfuscateJsonValues', () => {
  it('should obfuscate string values in an object', () => {
    const obj = { name: 'John Doe', age: '30' }
    const expected = { name: '__string', age: '__string' }
    expect(obfuscateJsonValues(obj)).toEqual(expected)
  })

  it('should obfuscate string values in a nested object', () => {
    const obj = { user: { name: 'Jane Doe', age: '25' }, active: true }
    const expected = {
      user: { name: '__string', age: '__string' },
      active: '__boolean',
    }
    expect(obfuscateJsonValues(obj, 1)).toEqual(expected)
  })

  it('should obfuscate string values in an array', () => {
    const arr = ['John Doe', '30']
    const expected = ['__string', '__string']
    expect(obfuscateJsonValues(arr)).toEqual(expected)
  })

  it('should handle mixed types in an array', () => {
    const arr = ['Jane Doe', 25, { email: 'jane@example.com' }]
    const expected = ['__string', '__number', { email: '__string' }]
    expect(obfuscateJsonValues(arr, 1)).toEqual(expected)
  })

  it('should not obfuscate if depth is not reached', () => {
    const obj = { a: 'A', l2: { b: 'B', l3: { c: 'C', l4: { d: 'D' } } } }
    const expected = {
      a: 'A',
      l2: { b: 'B', l3: { c: '__string', l4: { d: '__string' } } },
    }
    expect(obfuscateJsonValues(obj, 3)).toEqual(expected)
  })

  it('should obfuscate null and undefined values correctly', () => {
    const obj = {
      key1: null,
      key2: undefined,
      key3: false,
      key4: 0,
      key5: '',
    }
    const expected = {
      key1: '__null',
      key2: '__null', // Note: undefined values are also obfuscated to '__null'
      key3: '__boolean',
      key4: '__number',
      key5: '__string',
    }
    expect(obfuscateJsonValues(obj)).toEqual(expected)
  })
})
