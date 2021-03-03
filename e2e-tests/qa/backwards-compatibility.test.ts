import { difference } from 'lodash'
import { run } from './runner'
import { startLocalServer } from './server'

let url: string

beforeAll(async () => {
  url = await startLocalServer()
})

describe('Backwards compatibility', () => {
  test('provides all same properties', async () => {
    const code = `(() => {
      return [
        ...new Set([
          ...Object.getOwnPropertyNames(Object.getPrototypeOf(window.analytics)),
          ...Object.getOwnPropertyNames(window.analytics)
        ])
      ].sort()
    })()`

    const results = await run(url, '***REMOVED***', code)

    const next = results.next.codeEvaluation as string[]
    const classic = results.classic.codeEvaluation as string[]

    const missing = difference(classic, next).filter(
      (fn) =>
        !fn.startsWith('_') &&
        // These are inherited through Emitter
        !['emit', 'off', 'on', 'once', 'require'].includes(fn)
    )
    expect(missing).toEqual([])
  })

  test('accesses user_id the same way', async () => {
    const code = `(async () => {
      await analytics.identify('Test User')
      return analytics.user().id()
    })()`

    const results = await run(url, '***REMOVED***', code)

    const nextId = results.next.codeEvaluation
    const classicId = results.classic.codeEvaluation

    expect(nextId).toEqual(classicId)
    expect(nextId).not.toBeFalsy()
  })

  test('accesses traits the same way', async () => {
    const code = `(async () => {
      await analytics.identify('Test User', { email: 'test@example.org' })
      return analytics.user().traits()
    })()`

    const results = await run(url, '***REMOVED***', code)

    const nextId = results.next.codeEvaluation as { email: string }
    const classicId = results.classic.codeEvaluation as { email: string }

    expect(nextId).toEqual(classicId)
    expect(nextId.email).toEqual('test@example.org')
  })
})
