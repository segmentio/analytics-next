import { NodeEventFactory } from '../../../app/event-factory'
import { TestFetchClient } from '../../../__tests__/test-helpers/factories'
import { createConfiguredNodePlugin } from '../index'
import { PublisherProps } from '../publisher'
import { Context } from '../../../app/context'
import { Emitter } from '@segment/analytics-core'
import {
  bodyPropertyMatchers,
  assertSegmentApiBody,
} from './test-helpers/segment-http-api'

let emitter: Emitter
const createTestNodePlugin = (props: PublisherProps) =>
  createConfiguredNodePlugin(props, emitter)

const testClient = new TestFetchClient()

const validateFetcherInputs = (...contexts: Context[]) => {
  const [url, request] = testClient.lastCall
  return assertSegmentApiBody(url, request, contexts)
}

const eventFactory = new NodeEventFactory()

beforeEach(() => {
  emitter = new Emitter()
  testClient.reset()
  jest.useFakeTimers()
})

test('alias', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    maxEventsInBatch: 1,
    flushInterval: 1000,
    writeKey: '',
    httpClient: testClient,
  })

  const event = eventFactory.alias('to', 'from')
  const context = new Context(event)

  testClient.callCount = 0

  await segmentPlugin.alias(context)

  expect(testClient.callCount == 1)
  validateFetcherInputs(context)

  const [, request] = testClient.lastCall
  const body = JSON.parse(request.body)

  expect(body.batch).toHaveLength(1)
  expect(body.batch[0]).toEqual({
    ...bodyPropertyMatchers,
    type: 'alias',
    previousId: 'from',
    userId: 'to',
  })
})

test('group', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    maxEventsInBatch: 1,
    flushInterval: 1000,
    writeKey: '',
    httpClient: testClient,
  })

  const event = eventFactory.group(
    'foo-group-id',
    {
      name: 'libraries',
    },
    { userId: 'foo-user-id' }
  )
  const context = new Context(event)

  testClient.callCount = 0

  await segmentPlugin.group(context)

  expect(testClient.callCount == 1)
  validateFetcherInputs(context)

  const [, request] = testClient.lastCall
  const body = JSON.parse(request.body)

  expect(body.batch).toHaveLength(1)
  expect(body.batch[0]).toEqual({
    ...bodyPropertyMatchers,
    traits: {
      name: 'libraries',
    },
    type: 'group',
    groupId: 'foo-group-id',
    userId: 'foo-user-id',
  })
})

test('identify', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    maxEventsInBatch: 1,
    flushInterval: 1000,
    writeKey: '',
    httpClient: testClient,
  })

  const event = eventFactory.identify('foo-user-id', {
    name: 'Chris Radek',
  })
  const context = new Context(event)

  testClient.callCount = 0
  await segmentPlugin.identify(context)

  expect(testClient.callCount == 1)
  validateFetcherInputs(context)

  const [, request] = testClient.lastCall
  const body = JSON.parse(request.body)
  expect(body.batch).toHaveLength(1)
  expect(body.batch[0]).toEqual({
    ...bodyPropertyMatchers,
    traits: {
      name: 'Chris Radek',
    },
    type: 'identify',
    userId: 'foo-user-id',
  })
})

test('page', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    maxEventsInBatch: 1,
    flushInterval: 1000,
    writeKey: '',
    httpClient: testClient,
  })

  const event = eventFactory.page(
    'Category',
    'Home',
    { url: 'http://localhost' },
    { userId: 'foo-user-id' }
  )
  const context = new Context(event)

  testClient.callCount = 0
  await segmentPlugin.page(context)

  expect(testClient.callCount == 1)
  validateFetcherInputs(context)

  const [, request] = testClient.lastCall
  const body = JSON.parse(request.body)

  expect(body.batch).toHaveLength(1)
  expect(body.batch[0]).toEqual({
    ...bodyPropertyMatchers,
    type: 'page',
    userId: 'foo-user-id',
    name: 'Home',
    category: 'Category',
    properties: {
      category: 'Category',
      url: 'http://localhost',
    },
  })
})

test('screen', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    maxEventsInBatch: 1,
    flushInterval: 1000,
    writeKey: '',
    httpClient: testClient,
  })

  const event = eventFactory.screen(
    'Category',
    'Home',
    { variation: 'local' },
    { userId: 'foo-user-id' }
  )
  const context = new Context(event)

  testClient.callCount = 0
  await segmentPlugin.screen(context)

  expect(testClient.callCount == 1)
  validateFetcherInputs(context)

  const [, request] = testClient.lastCall
  const body = JSON.parse(request.body)

  expect(body.batch).toHaveLength(1)
  expect(body.batch[0]).toEqual({
    ...bodyPropertyMatchers,
    type: 'screen',
    userId: 'foo-user-id',
    name: 'Home',
    category: 'Category',
    properties: {
      variation: 'local',
    },
  })
})

test('track', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    maxEventsInBatch: 1,
    flushInterval: 1000,
    writeKey: '',
    httpClient: testClient,
  })

  const event = eventFactory.track(
    'test event',
    { foo: 'bar' },
    { userId: 'foo-user-id' }
  )
  const context = new Context(event)

  testClient.callCount = 0
  await segmentPlugin.screen(context)

  expect(testClient.callCount == 1)
  validateFetcherInputs(context)

  const [, request] = testClient.lastCall
  const body = JSON.parse(request.body)

  expect(body.batch).toHaveLength(1)
  expect(body.batch[0]).toEqual({
    ...bodyPropertyMatchers,
    type: 'track',
    event: 'test event',
    userId: 'foo-user-id',
    properties: {
      foo: 'bar',
    },
  })
})
