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

    it('should set the rawAnalytics property', () => {
      expect(analyticsService['rawAnalytics']).toBe(analyticsMock)
    })

    it('should set the loadNormally property', () => {
      expect(analyticsService['loadNormally']).toBe(analyticsMock.load)
    })

    it('should set the cdnSettings property', () => {
      expect(analyticsService['cdnSettings']).toBeInstanceOf(Promise)
    })
  })

  describe('replaceLoadMethod', () => {
    it('should replace the load method with the provided function', () => {
      const newLoadFn = jest.fn()
      analyticsService.replaceLoadMethod(newLoadFn)
      expect(analyticsService['analytics'].load).toBe(newLoadFn)
    })
  })

  describe('configureConsentStampingMiddleware', () => {
    it('should add the middleware to the analytics instance', () => {
      const mockMiddleware = jest.fn()
      analyticsService.configureConsentStampingMiddleware(mockMiddleware)
      expect(analyticsMock.addSourceMiddleware).toHaveBeenCalledWith(
        mockMiddleware
      )
    })
  })

  describe('consentChange', () => {
    it('should call the track method with the expected arguments', () => {
      const mockCategories = { C0001: true, C0002: false }
      analyticsService.consentChange(mockCategories)
      expect(analyticsMock.track).toHaveBeenCalledWith(
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
      expect(console.error).toHaveBeenCalledWith(expect.any(ValidationError))
    })
  })
})
