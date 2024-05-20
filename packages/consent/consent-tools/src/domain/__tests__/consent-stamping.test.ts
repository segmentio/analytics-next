import { createConsentStampingMiddleware } from '../consent-stamping'
import { Context } from '@segment/analytics-next'
import { SourceMiddlewareFunction } from '../../types'

describe(createConsentStampingMiddleware, () => {
  let middlewareFn: SourceMiddlewareFunction
  const nextFn = jest.fn()
  const getCategories = jest.fn()
  const payload = {
    obj: {
      context: new Context({ type: 'track' }),
    },
  }

  it('should stamp event with consent categories', async () => {
    middlewareFn = createConsentStampingMiddleware(getCategories)
    getCategories.mockResolvedValue({ Advertising: true })
    await middlewareFn({
      next: nextFn,
      // @ts-ignore
      payload,
    })
    expect(nextFn).toBeCalledWith(payload)
    // @ts-ignore
    expect(payload.obj.context.consent.categoryPreferences).toEqual({
      Advertising: true,
    })
  })

  it('should work if getCategories() is synchronous', async () => {
    middlewareFn = createConsentStampingMiddleware(getCategories)
    getCategories.mockReturnValue({ Advertising: true })
    await middlewareFn({
      next: nextFn,
      // @ts-ignore
      payload,
    })
    expect(nextFn).toBeCalledWith(payload)
    // @ts-ignore
    expect(payload.obj.context.consent.categoryPreferences).toEqual({
      Advertising: true,
    })
  })
})
