import { Analytics } from '../../../core/analytics'
import { createInboxAPI, GistInboxMessage } from '../inbox_messages'

function makeMessage(
  overrides: Partial<GistInboxMessage> = {}
): GistInboxMessage {
  return {
    messageType: 'inline',
    expiry: '',
    priority: 0,
    type: 'test',
    properties: {},
    queueId: `msg-${Math.random().toString(36).slice(2)}`,
    userToken: 'user-1',
    deliveryId: 'delivery-1',
    sentAt: new Date().toISOString(),
    opened: false,
    ...overrides,
  }
}

function createMockGist(messages: GistInboxMessage[]) {
  const listeners: Record<string, Function[]> = {}
  return {
    getInboxMessages: jest.fn().mockResolvedValue(messages),
    updateInboxMessageOpenState: jest.fn(),
    removeInboxMessage: jest.fn(),
    events: {
      on: jest.fn((event: string, cb: Function) => {
        if (!listeners[event]) listeners[event] = []
        listeners[event].push(cb)
      }),
      off: jest.fn(),
      emit: (event: string, data: any) => {
        ;(listeners[event] || []).forEach((cb) => cb(data))
      },
    },
  }
}

describe('Inbox _cio topic filtering', () => {
  const analytics = { track: jest.fn() } as unknown as Analytics

  const regularMessage = makeMessage({
    queueId: 'regular',
    topics: ['news'],
  })
  const noTopicMessage = makeMessage({
    queueId: 'no-topic',
    topics: [],
  })
  const cioMessage = makeMessage({
    queueId: 'cio-msg',
    topics: ['_cio_inbox_5'],
  })
  const mixedMessage = makeMessage({
    queueId: 'mixed-msg',
    topics: ['news', '_cio_feed'],
  })

  const allMessages = [regularMessage, noTopicMessage, cioMessage, mixedMessage]

  describe('no topics specified', () => {
    it('should return messages without _cio topics', async () => {
      const gist = createMockGist(allMessages)
      const inbox = createInboxAPI(analytics, gist, [])

      const messages = await inbox.messages()
      const ids = messages.map((m) => m.messageId)

      expect(ids).toContain('regular')
      expect(ids).toContain('no-topic')
      expect(ids).not.toContain('cio-msg')
      expect(ids).not.toContain('mixed-msg')
    })

    it('should not count _cio messages in total', async () => {
      const gist = createMockGist(allMessages)
      const inbox = createInboxAPI(analytics, gist, [])

      expect(await inbox.total()).toBe(2)
    })

    it('should not count _cio messages in totalUnopened', async () => {
      const gist = createMockGist(allMessages)
      const inbox = createInboxAPI(analytics, gist, [])

      expect(await inbox.totalUnopened()).toBe(2)
    })

    it('should filter _cio messages in onUpdates', async () => {
      const gist = createMockGist(allMessages)
      const inbox = createInboxAPI(analytics, gist, [])

      const result = await new Promise<any[]>((resolve) => {
        inbox.onUpdates((messages) => resolve(messages))
        gist.events.emit('messageInboxUpdated', allMessages)
      })

      const ids = result.map((m) => m.messageId)
      expect(ids).toContain('regular')
      expect(ids).toContain('no-topic')
      expect(ids).not.toContain('cio-msg')
      expect(ids).not.toContain('mixed-msg')
    })
  })

  describe('non-_cio topic specified', () => {
    it('should return matching messages but exclude _cio messages', async () => {
      const gist = createMockGist(allMessages)
      const inbox = createInboxAPI(analytics, gist, ['news'])

      const messages = await inbox.messages()
      const ids = messages.map((m) => m.messageId)

      expect(ids).toContain('regular')
      expect(ids).not.toContain('no-topic')
      expect(ids).not.toContain('cio-msg')
      // mixed-msg has 'news' but also has '_cio_feed', should be excluded
      expect(ids).not.toContain('mixed-msg')
    })

    it('should not count _cio messages in total', async () => {
      const gist = createMockGist(allMessages)
      const inbox = createInboxAPI(analytics, gist, ['news'])

      expect(await inbox.total()).toBe(1)
    })
  })

  describe('_cio topic explicitly specified', () => {
    it('should return _cio messages when explicitly requested', async () => {
      const gist = createMockGist(allMessages)
      const inbox = createInboxAPI(analytics, gist, ['_cio_inbox_5'])

      const messages = await inbox.messages()
      const ids = messages.map((m) => m.messageId)

      expect(ids).toContain('cio-msg')
      expect(ids).not.toContain('mixed-msg')
      expect(ids).not.toContain('regular')
      expect(ids).not.toContain('no-topic')
    })

    it('should return _cio messages when a _cio topic is requested alongside others', async () => {
      const gist = createMockGist(allMessages)
      const inbox = createInboxAPI(analytics, gist, ['news', '_cio_feed'])

      const messages = await inbox.messages()
      const ids = messages.map((m) => m.messageId)

      expect(ids).toContain('regular')
      expect(ids).toContain('mixed-msg')
      expect(ids).not.toContain('no-topic')
      expect(ids).not.toContain('cio-msg')
    })
  })
})
