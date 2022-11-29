import { abortSignalAfterTimeout } from '../abort-signal'
import nock from 'nock'
import { fetch } from '../fetch'
import { sleep } from '@segment/analytics-core'

describe(abortSignalAfterTimeout, () => {
  const HOST = 'https://foo.com'
  it('should not abort operation if timeout has not expired', async () => {
    jest.useRealTimers()
    try {
      nock(HOST).get('/').reply(201)
      const signal = abortSignalAfterTimeout(1000)
      await fetch(HOST, { signal })
    } catch (err: any) {
      throw Error('fail')
    }
  })

  it('should abort operation if timeout expires', async () => {
    jest.useFakeTimers()
    nock(HOST)
      .get('/')
      .reply(201, async () => {
        await sleep(10000)
        return true
      })
    try {
      const signal = abortSignalAfterTimeout(2000)
      jest.advanceTimersByTime(6000)
      await fetch(HOST, { signal })
      throw Error('fail test.')
    } catch (err: any) {
      expect(err.name).toMatch('AbortError')
      expect(err.message).toMatch('The user aborted a request')
    }
  })
  it('should abort operation immediately if timeout is 0', async () => {
    jest.useRealTimers()
    try {
      nock(HOST).get('/').reply(201)
      await fetch(HOST, { signal: abortSignalAfterTimeout(0) })
      throw Error('fail test.')
    } catch (err: any) {
      expect(err.name).toMatch('AbortError')
      expect(err.message).toMatch('The user aborted a request')
    }
  })
})
