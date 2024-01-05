import { NodeEventFactory } from '../../../app/event-factory'
import { createSuccess } from '../../../__tests__/test-helpers/factories'
import { createConfiguredNodePlugin } from '../index'
import { PublisherProps } from '../publisher'
import { Context } from '../../../app/context'
import { Emitter } from '@segment/analytics-generic-utils'
import {
  assertHTTPRequestOptions,
  httpClientOptionsBodyMatcher,
} from '../../../__tests__/test-helpers/assert-shape'
import { TestFetchClient } from '../../../__tests__/test-helpers/create-test-analytics'

let emitter: Emitter
const testClient = new TestFetchClient()
const makeReqSpy = jest.spyOn(testClient, 'makeRequest')
const getLastRequest = () => makeReqSpy.mock.lastCall![0]

const createTestNodePlugin = (props: Partial<PublisherProps> = {}) =>
  createConfiguredNodePlugin(
    {
      maxRetries: 3,
      flushAt: 1,
      flushInterval: 1000,
      writeKey: '',
      httpClient: testClient,
      ...props,
    },
    emitter
  )

const validateMakeReqInputs = (...contexts: Context[]) => {
  return assertHTTPRequestOptions(getLastRequest(), contexts)
}

const eventFactory = new NodeEventFactory()

beforeEach(() => {
  emitter = new Emitter()
  makeReqSpy.mockReturnValue(createSuccess())
  jest.useFakeTimers()
})

test('alias', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin()

  const event = eventFactory.alias('to', 'from')
  const context = new Context(event)

  makeReqSpy.mockReturnValueOnce(createSuccess())
  await segmentPlugin.alias(context)

  expect(makeReqSpy).toHaveBeenCalledTimes(1)
  validateMakeReqInputs(context)

  const data = getLastRequest().data

  expect(data.batch).toHaveLength(1)
  expect(data.batch[0]).toEqual({
    ...httpClientOptionsBodyMatcher,
    type: 'alias',
    previousId: 'from',
    userId: 'to',
  })
})

test('group', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin()

  const event = eventFactory.group(
    'foo-group-id',
    {
      name: 'libraries',
    },
    { userId: 'foo-user-id' }
  )
  const context = new Context(event)

  makeReqSpy.mockReturnValueOnce(createSuccess())
  await segmentPlugin.group(context)

  expect(makeReqSpy).toHaveBeenCalledTimes(1)
  validateMakeReqInputs(context)

  const data = getLastRequest().data

  expect(data.batch).toHaveLength(1)
  expect(data.batch[0]).toEqual({
    ...httpClientOptionsBodyMatcher,
    traits: {
      name: 'libraries',
    },
    type: 'group',
    groupId: 'foo-group-id',
    userId: 'foo-user-id',
  })
})

test('identify', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin()

  const event = eventFactory.identify('foo-user-id', {
    name: 'Chris Radek',
  })
  const context = new Context(event)

  makeReqSpy.mockReturnValueOnce(createSuccess())
  await segmentPlugin.identify(context)

  expect(makeReqSpy).toHaveBeenCalledTimes(1)
  validateMakeReqInputs(context)

  const data = getLastRequest().data
  expect(data.batch).toHaveLength(1)
  expect(data.batch[0]).toEqual({
    ...httpClientOptionsBodyMatcher,
    traits: {
      name: 'Chris Radek',
    },
    type: 'identify',
    userId: 'foo-user-id',
  })
})

test('page', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin()

  const event = eventFactory.page(
    'Category',
    'Home',
    { url: 'http://localhost' },
    { userId: 'foo-user-id' }
  )
  const context = new Context(event)

  makeReqSpy.mockReturnValueOnce(createSuccess())
  await segmentPlugin.page(context)

  expect(makeReqSpy).toHaveBeenCalledTimes(1)
  validateMakeReqInputs(context)

  const data = getLastRequest().data

  expect(data.batch).toHaveLength(1)
  expect(data.batch[0]).toEqual({
    ...httpClientOptionsBodyMatcher,
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
  const { plugin: segmentPlugin } = createTestNodePlugin()

  const event = eventFactory.screen(
    'Category',
    'Home',
    { variation: 'local' },
    { userId: 'foo-user-id' }
  )
  const context = new Context(event)

  makeReqSpy.mockReturnValueOnce(createSuccess())
  await segmentPlugin.screen(context)

  expect(makeReqSpy).toHaveBeenCalledTimes(1)
  validateMakeReqInputs(context)

  const data = getLastRequest().data

  expect(data.batch).toHaveLength(1)
  expect(data.batch[0]).toEqual({
    ...httpClientOptionsBodyMatcher,
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
  const { plugin: segmentPlugin } = createTestNodePlugin()

  const event = eventFactory.track(
    'test event',
    { foo: 'bar' },
    { userId: 'foo-user-id' }
  )
  const context = new Context(event)

  makeReqSpy.mockReturnValueOnce(createSuccess())
  await segmentPlugin.screen(context)

  expect(makeReqSpy).toHaveBeenCalledTimes(1)
  validateMakeReqInputs(context)

  const data = getLastRequest().data

  expect(data.batch).toHaveLength(1)
  expect(data.batch[0]).toEqual({
    ...httpClientOptionsBodyMatcher,
    type: 'track',
    event: 'test event',
    userId: 'foo-user-id',
    properties: {
      foo: 'bar',
    },
  })
})
