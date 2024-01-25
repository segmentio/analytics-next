import { NodeEmitterEvents } from '../../../app/emitter'
type HttpRequestEmitterEvent = NodeEmitterEvents['http_request'][0]

export const assertHttpRequestEmittedEvent = (
  event: HttpRequestEmitterEvent
) => {
  const body = JSON.parse(event.body)
  expect(Array.isArray(body.batch)).toBeTruthy()
  expect(body.batch.length).toBe(1)
  expect(typeof event.headers).toBe('object')
  expect(typeof event.method).toBe('string')
  expect(typeof event.url).toBe('string')
}
