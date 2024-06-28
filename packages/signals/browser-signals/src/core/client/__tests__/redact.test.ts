import { redactJsonValues } from '../redact'

describe('redactJsonValues', () => {
  it('should redact string values in an object', () => {
    const obj = { name: 'John Doe', age: '30' }
    const expected = { name: 'XXXX XXX', age: '99' }
    expect(redactJsonValues(obj)).toEqual(expected)
  })

  it('should redact string values in a nested object', () => {
    const obj = { user: { name: 'Jane Doe', age: '25' }, active: true }
    const expected = {
      user: { name: 'XXXX XXX', age: '99' },
      active: 'true/false',
    }
    expect(redactJsonValues(obj, 1, 8)).toEqual(expected)
  })

  it('should redact string values in an array', () => {
    const arr = ['John Doe', '30']
    const expected = ['XXXX XXX', '99']
    expect(redactJsonValues(arr)).toEqual(expected)
  })

  it('should handle mixed types in an array', () => {
    const arr = ['Jane Doe', 25, { email: 'jane@example.com' }]
    const expected = ['XXXX XXX', 99, { email: 'XXXX@XXX' }]
    expect(redactJsonValues(arr, 1, 8)).toEqual(expected)
  })

  it('should not redact if depth is not reached', () => {
    const obj = { a: 'A', l2: { b: 'B', l3: { c: 'C', l4: { d: 'D' } } } }
    const expected = { a: 'A', l2: { b: 'B', l3: { c: 'X', l4: { d: 'X' } } } }
    expect(redactJsonValues(obj, 3, 8)).toEqual(expected)
  })
})
