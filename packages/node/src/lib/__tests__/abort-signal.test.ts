import { abortSignalAfterTimeout } from '../abort-signal'
import nock from 'nock'
import { fetch } from '../fetch'

describe(abortSignalAfterTimeout, () => {
  const HOST = 'https://foo.com'
  let scope: nock.Scope
  beforeEach(() => {
    scope = nock(HOST).get('/').reply(201).persist()
  })
  it('should abort fetch and throw an error after a timeout', () => {
    const promise = fetch(HOST, { signal: abortSignalAfterTimeout(0) as any })
    return expect(promise).rejects.toEqual('foo')
  })
})
