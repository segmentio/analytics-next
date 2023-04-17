import { pick } from '../pick'

describe(pick, () => {
  it.each([
    {
      obj: { a: 1, b: '2', c: 3 },
      keys: ['a', 'c'],
      expected: { a: 1, c: 3 },
    },
    {
      obj: { a: 1, '0': false, c: 3 },
      keys: ['a', '0'],
      expected: { a: 1, '0': false },
    },
    { obj: { a: 1, b: '2', c: 3 }, keys: [], expected: {} },
    {
      obj: { a: undefined, b: null, c: 1 },
      keys: ['a', 'b'],
      expected: { a: undefined, b: null },
    },
  ])('.pick($obj, $keys)', ({ obj, keys, expected }) => {
    expect(pick(obj, keys as (keyof typeof obj)[])).toEqual(expected)
  })
  it('does not mutate object reference', () => {
    const e = {
      obj: { a: 1, '0': false, c: 3 },
      keys: ['a', '0'] as const,
      expected: { a: 1, '0': false },
    }
    const ogObj = { ...e.obj }
    pick(e.obj, e.keys)
    expect(e.obj).toEqual(ogObj)
  })
})
