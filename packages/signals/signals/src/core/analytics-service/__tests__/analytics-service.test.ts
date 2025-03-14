import { analyticsMock } from '../../../test-helpers/mocks'
import { SegmentEventStub } from '../../../types'
import { AnalyticsService } from '../index'

describe(AnalyticsService, () => {
  const mockAnalyticsInstance = {
    ...analyticsMock,
    settings: {
      ...analyticsMock.settings,
      writeKey: 'foo',
    },
  }

  let service: AnalyticsService
  beforeEach(() => {
    service = new AnalyticsService(mockAnalyticsInstance)
  })

  it('should return the correct write key', () => {
    expect(service.instance.settings.writeKey).toBe('foo')
  })

  describe('createSegmentInstrumentationEventGenerator', () => {
    it('should register and emit signals for non-Signal events', async () => {
      const generator = service.createSegmentInstrumentationEventGenerator()
      const mockSignalEmitter = { emit: jest.fn() }
      const mockEvent: SegmentEventStub = {
        type: 'track',
        context: {
          foo: 123,
        },
      }

      await generator.register(mockSignalEmitter as any)

      const middleware =
        mockAnalyticsInstance.addSourceMiddleware.mock.calls[0][0]
      middleware({ payload: { obj: mockEvent }, next: jest.fn() })

      expect(mockSignalEmitter.emit).toHaveBeenCalledTimes(1)
      const call = mockSignalEmitter.emit.mock.calls[0][0]
      delete call.data.page
      expect(call).toMatchInlineSnapshot(`
        {
          "anonymousId": "",
          "data": {
            "rawEvent": {
              "context": {
                "foo": 123,
              },
              "type": "track",
            },
          },
          "timestamp": <ISO Timestamp>,
          "type": "instrumentation",
        }
      `)
    })
    it('should not emit signals if the event is a Signal event', async () => {
      const generator = service.createSegmentInstrumentationEventGenerator()
      const mockSignalEmitter = { emit: jest.fn() }
      const mockEvent: SegmentEventStub = {
        type: 'track',
        context: {
          __eventOrigin: {
            type: 'Signal',
          },
        },
      }

      await generator.register(mockSignalEmitter as any)

      const middleware =
        mockAnalyticsInstance.addSourceMiddleware.mock.calls[0][0]
      middleware({ payload: { obj: mockEvent }, next: jest.fn() })

      expect(mockSignalEmitter.emit).not.toHaveBeenCalled()
    })

    it('should not emit signals after disable is called', async () => {
      const generator = service.createSegmentInstrumentationEventGenerator()
      const mockSignalEmitter = { emit: jest.fn() }
      const mockEvent: SegmentEventStub = {
        type: 'track',
        context: {
          __eventOrigin: {
            type: 'Signal',
          },
        },
      }

      const disable = await generator.register(mockSignalEmitter as any)
      disable()

      const middleware =
        mockAnalyticsInstance.addSourceMiddleware.mock.calls[0][0]
      middleware({ payload: { obj: mockEvent }, next: jest.fn() })

      expect(mockSignalEmitter.emit).not.toHaveBeenCalled()
    })
  })
})
