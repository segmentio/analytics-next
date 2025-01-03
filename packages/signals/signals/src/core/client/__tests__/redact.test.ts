import { NetworkSignalMetadata } from '@segment/analytics-signals-runtime'
import { createMockTarget } from '../../../test-helpers/mocks/factories'
import * as factories from '../../../types/factories'
import { redactJsonValues, redactSignalData } from '../redact'

describe(redactJsonValues, () => {
  it('should redact string values in an object', () => {
    const obj = { name: 'John Doe', age: '30' }
    const expected = { name: 'XXX', age: 'XXX' }
    expect(redactJsonValues(obj)).toEqual(expected)
  })

  it('should redact string values in a nested object', () => {
    const obj = { user: { name: 'Jane Doe', age: '25' }, active: true }
    const expected = {
      user: { name: 'XXX', age: 'XXX' },
      active: true,
    }
    expect(redactJsonValues(obj, 1)).toEqual(expected)
  })
  it('should not redact null or undefined values', () => {
    const obj = { name: 'John Doe', age: null, email: undefined }
    const expected = { name: 'XXX', age: null, email: undefined }
    expect(redactJsonValues(obj)).toEqual(expected)
  })

  it('should redact bigint values', () => {
    const obj = { name: 'John Doe', age: BigInt(30) }
    const expected = { name: 'XXX', age: 999 }
    expect(redactJsonValues(obj)).toEqual(expected)
  })

  it('should redact boolean values by setting them to true', () => {
    const obj = { name: 'John Doe', active: false }
    const expected = { name: 'XXX', active: true }
    expect(redactJsonValues(obj)).toEqual(expected)
  })

  it('should redact string values in an array', () => {
    const arr = ['John Doe', '30']
    const expected = ['XXX', 'XXX']
    expect(redactJsonValues(arr)).toEqual(expected)
  })

  it('should handle mixed types in an array', () => {
    const arr = ['Jane Doe', 25, { email: 'jane@example.com' }]
    const expected = ['XXX', 999, { email: 'XXX' }]
    expect(redactJsonValues(arr, 1)).toEqual(expected)
  })

  it('should not redact if depth is not reached', () => {
    const obj = { a: 'A', l2: { b: 'B', l3: { c: 'C', l4: { d: 'D' } } } }
    const expected = {
      a: 'A',
      l2: { b: 'B', l3: { c: 'XXX', l4: { d: 'XXX' } } },
    }
    expect(redactJsonValues(obj, 3)).toEqual(expected)
  })
})

describe(redactSignalData, () => {
  const metadataFixture: NetworkSignalMetadata = {
    filters: {
      allowed: [],
      disallowed: [],
    },
  }
  it('should return the signal as is if the type is "instrumentation"', () => {
    const signal = factories.createInstrumentationSignal({
      foo: 123,
    } as any)
    expect(redactSignalData(signal)).toEqual(signal)
  })

  it('should return the signal as is if the type is "userDefined"', () => {
    const signal = { type: 'userDefined', data: { value: 'secret' } } as const
    expect(redactSignalData(signal)).toEqual(signal)
  })

  it('should redact the value in the "target" property if the type is "interaction"', () => {
    const signal = factories.createInteractionSignal({
      eventType: 'change',
      change: { value: 'secret' },
      listener: 'onchange',
      target: createMockTarget({
        value: 'secret',
        formData: { password: '123' },
      }),
    })
    const expected = factories.createInteractionSignal({
      eventType: 'change',
      change: { value: 'XXX' },
      listener: 'onchange',
      target: createMockTarget({ value: 'XXX', formData: { password: 'XXX' } }),
    })
    expect(redactSignalData(signal)).toEqual(expected)
  })

  it('should redact attributes in change and in target if the listener is "mutation"', () => {
    const signal = factories.createInteractionSignal({
      eventType: 'change',
      change: { 'aria-selected': 'value' },
      listener: 'mutation',
      target: createMockTarget({
        attributes: { 'aria-selected': 'value', foo: 'value' },
        textContent: 'value',
        innerText: 'value',
      }),
    })
    const expected = factories.createInteractionSignal({
      eventType: 'change',
      change: { 'aria-selected': 'XXX' },
      listener: 'mutation',
      target: createMockTarget({
        attributes: { 'aria-selected': 'XXX', foo: 'XXX' },
        textContent: 'XXX',
        innerText: 'XXX',
      }),
    })
    expect(redactSignalData(signal)).toEqual(expected)
  })

  it('should redact the textContent and innerText in the "target" property if the listener is "contenteditable"', () => {
    const signal = factories.createInteractionSignal({
      eventType: 'change',
      listener: 'contenteditable',
      change: { textContent: 'secret' },
      target: createMockTarget({ textContent: 'secret', innerText: 'secret' }),
    })
    const expected = factories.createInteractionSignal({
      eventType: 'change',
      listener: 'contenteditable',
      change: { textContent: 'XXX' },
      target: createMockTarget({ textContent: 'XXX', innerText: 'XXX' }),
    })
    expect(redactSignalData(signal)).toEqual(expected)
  })

  it('should redact the values in the "data" property if the type is "network"', () => {
    const signal = factories.createNetworkSignal(
      {
        contentType: 'application/json',
        action: 'request',
        method: 'POST',
        url: 'http://foo.com',
        data: { name: 'John Doe', age: 30 },
      },
      metadataFixture
    )
    const expected = factories.createNetworkSignal(
      {
        contentType: 'application/json',
        action: 'request',
        method: 'POST',
        url: 'http://foo.com',
        data: { name: 'XXX', age: 999 },
      },
      metadataFixture
    )
    expect(redactSignalData(signal)).toEqual(expected)
  })

  it('should not mutate the original signal object', () => {
    const originalSignal = factories.createInteractionSignal({
      eventType: 'click',
      target: createMockTarget({ value: 'sensitiveData' }),
    })
    const originalSignalCopy = JSON.parse(JSON.stringify(originalSignal))

    redactSignalData(originalSignal)
    expect(originalSignal).toEqual(originalSignalCopy)
  })
})
