import { abortSignalAfterTimeout } from '../abort'
import nock from 'nock'
import { sleep } from '@segment/analytics-core'
import { DefaultHTTPClient } from '../default-http-client'

describe(abortSignalAfterTimeout, () => {
  const HOST = 'https://foo.com'
  beforeEach(() => {
    nock.cleanAll()
  })
  it('should not abort operation if timeout has not expired', async () => {
    jest.useRealTimers()
    nock(HOST).get('/').reply(201)
    try {
      const [signal] = abortSignalAfterTimeout(1000)
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
      const [signal] = abortSignalAfterTimeout(2000)
      jest.advanceTimersByTime(6000)
      const client = new DefaultHTTPClient()
      await client.send(HOST, { signal })
      throw Error('fail test.')
    } catch (err: any) {
      expect(err.name).toMatch('AbortError')
      expect(err.message).toMatch('The user aborted a request')
    }
  })
  it('should abort operation immediately if timeout is 0', async () => {
    jest.useRealTimers()
    nock(HOST).get('/').reply(201)
    const [signal] = abortSignalAfterTimeout(0)
    try {
      const client = new DefaultHTTPClient()
      await client.send(HOST, { signal })
      throw Error('fail test.')
    } catch (err: any) {
      expect(err.name).toMatch('AbortError')
      expect(err.message).toMatch('The user aborted a request')
    }
  })
})
