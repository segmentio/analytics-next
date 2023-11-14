import { AnalyticsService } from '../analytics-service'
import { analyticsMock } from '../../../test-helpers/mocks'
import { ValidationError } from '../../validation/validation-error'

describe(AnalyticsService, () => {
  let analyticsService: AnalyticsService

  beforeEach(() => {
    analyticsService = new AnalyticsService(analyticsMock)
  })

  describe('constructor', () => {
    it('should throw an error if the analytics instance is not valid', () => {
      // @ts-ignore
      expect(() => new AnalyticsService(undefined)).toThrowError(
        ValidationError
      )
    })
  })

  describe('cdnSettings', () => {
    it('should be a promise', async () => {
      expect(analyticsMock.on).toBeCalledTimes(1)
      expect(analyticsMock.on.mock.lastCall[0]).toBe('initialize')
      analyticsMock.on.mock.lastCall[1]({ integrations: {} })

      await expect(analyticsService['cdnSettings']).resolves.toEqual({
        integrations: {},
      })
    })
  })

  describe('loadNormally', () => {
    it('loads normally', () => {
      analyticsService = new AnalyticsService(analyticsMock)
      analyticsService.loadNormally('foo')
      expect(analyticsMock.load).toBeCalled()
    })

    it('uses the correct value of *this*', () => {
      let that: any
      function fn(this: any) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        that = this
      }
      const _analyticsMock = {
        ...analyticsMock,
        load: fn,
        name: 'some instance',
      }
      analyticsService = new AnalyticsService(_analyticsMock)
      analyticsService.loadNormally('foo')
      expect(that.name).toEqual('some instance')
    })

    it('will always call the original .load method', () => {
      const ogLoad = jest.fn()
      analyticsService = new AnalyticsService({
        ...analyticsMock,
        load: ogLoad,
      })
      const replaceLoadMethod = jest.fn()
      analyticsService.replaceLoadMethod(replaceLoadMethod)
      analyticsService.loadNormally('foo')
      expect(ogLoad).toHaveBeenCalled()
      analyticsService.replaceLoadMethod(replaceLoadMethod)
      analyticsService.loadNormally('foo')
      expect(replaceLoadMethod).not.toBeCalled()
    })
  })

  describe('replaceLoadMethod', () => {
    it('should replace the load method with the provided function', () => {
      const replaceLoadMethod = jest.fn()
      analyticsService.replaceLoadMethod(replaceLoadMethod)
      expect(analyticsService['analytics'].load).toBe(replaceLoadMethod)
    })
  })

  describe('configureConsentStampingMiddleware', () => {
    it('should add the middleware to the analytics instance', () => {
      const mockMiddleware = jest.fn()
      analyticsService.configureConsentStampingMiddleware(mockMiddleware)
      expect(analyticsMock.addSourceMiddleware).toBeCalledTimes(1)
      expect(analyticsMock.addSourceMiddleware).toBeCalledWith(
        expect.any(Function)
      )
    })
  })

  describe('consentChange', () => {
    it('should call the track method with the expected arguments', () => {
      const mockCategories = { C0001: true, C0002: false }
      analyticsService.consentChange(mockCategories)
      expect(analyticsMock.track).toBeCalledWith(
        'Segment Consent Preference',
        undefined,
        { consent: { categoryPreferences: mockCategories } }
      )
    })

    it('should log an error if the categories are invalid', () => {
      const mockCategories = { invalid: 'nope' } as any
      console.error = jest.fn()
      analyticsService.consentChange(mockCategories)
      expect(console.error).toBeCalledTimes(1)
      expect(console.error).toBeCalledWith(expect.any(ValidationError))
    })
  })
})
