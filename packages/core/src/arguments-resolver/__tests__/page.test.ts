import { resolvePageArguments } from '../page'

const bananaPhone = {
  banana: 'phone',
}

const baseOptions = {
  integrations: {
    amplitude: false,
  },
}

describe(resolvePageArguments, () => {
  test('should accept (category, name, properties, options, callback)', () => {
    const fn = jest.fn()
    const [category, name, properties, options, cb] = resolvePageArguments(
      'category',
      'name',
      bananaPhone,
      baseOptions,
      fn
    )

    expect(category).toEqual('category')
    expect(name).toEqual('name')
    expect(properties).toEqual(bananaPhone)
    expect(options).toEqual(baseOptions)
    expect(cb).toEqual(fn)
  })

  test('empty strings ("", "", "", { integrations })', () => {
    const [category, name, properties, options] = resolvePageArguments(
      '',
      '',
      null,
      {
        integrations: {
          Amplitude: {
            sessionId: '123',
          },
        },
      }
    )

    expect(category).toEqual('')
    expect(name).toEqual('')
    expect(properties).toEqual({})
    expect(options).toEqual({
      integrations: {
        Amplitude: {
          sessionId: '123',
        },
      },
    })
  })

  test('should accept (category, name, properties, callback)', () => {
    const fn = jest.fn()
    const [category, name, properties, options, cb] = resolvePageArguments(
      'category',
      'name',
      bananaPhone,
      fn
    )

    expect(category).toEqual('category')
    expect(name).toEqual('name')
    expect(properties).toEqual(bananaPhone)
    expect(cb).toEqual(fn)

    expect(options).toEqual({})
  })

  it('should accept (category, name, callback)', () => {
    const fn = jest.fn()
    const [category, name, properties, options, cb] = resolvePageArguments(
      'category',
      'name',
      fn
    )

    expect(category).toEqual('category')
    expect(name).toEqual('name')
    expect(properties).toEqual({})
    expect(cb).toEqual(fn)

    expect(options).toEqual({})
  })

  it('should accept (name, properties, options, callback)', () => {
    const fn = jest.fn()
    const [category, name, properties, options, cb] = resolvePageArguments(
      'name',
      bananaPhone,
      baseOptions,
      fn
    )

    expect(category).toEqual(null)
    expect(name).toEqual('name')
    expect(properties).toEqual(bananaPhone)
    expect(options).toEqual(baseOptions)
    expect(cb).toEqual(fn)
  })

  it('should accept (name, properties, callback)', () => {
    const fn = jest.fn()
    const [category, name, properties, options, cb] = resolvePageArguments(
      'name',
      bananaPhone,
      fn
    )

    expect(category).toEqual(null)
    expect(name).toEqual('name')
    expect(properties).toEqual(bananaPhone)
    expect(cb).toEqual(fn)
    expect(options).toEqual({})
  })

  it('should accept (name, callback)', () => {
    const fn = jest.fn()
    const [category, name, properties, options, cb] = resolvePageArguments(
      'name',
      fn
    )

    expect(name).toEqual('name')
    expect(cb).toEqual(fn)

    expect(category).toEqual(null)
    expect(properties).toEqual({})
    expect(options).toEqual({})
  })

  it('should accept (properties, options, callback)', () => {
    const fn = jest.fn()
    const [category, name, properties, options, cb] = resolvePageArguments(
      bananaPhone,
      baseOptions,
      fn
    )

    expect(cb).toEqual(fn)
    expect(properties).toEqual(bananaPhone)
    expect(options).toEqual(baseOptions)

    expect(name).toEqual(null)
    expect(category).toEqual(null)
  })

  it('should accept (properties, callback)', () => {
    const fn = jest.fn()
    const [category, name, properties, options, cb] = resolvePageArguments(
      bananaPhone,
      fn
    )

    expect(properties).toEqual(bananaPhone)
    expect(cb).toEqual(fn)

    expect(options).toEqual({})
    expect(name).toEqual(null)
    expect(category).toEqual(null)
  })
})
