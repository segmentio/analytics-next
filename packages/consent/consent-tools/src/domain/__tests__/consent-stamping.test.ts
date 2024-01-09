import { createConsentStampingMiddleware } from '../consent-stamping'
import { Context, MiddlewareFunction } from '@segment/analytics-next'

describe(createConsentStampingMiddleware, () => {
  let middlewareFn: MiddlewareFunction
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

  it('should throw an error if getCategories returns an invalid value', async () => {
    middlewareFn = createConsentStampingMiddleware(getCategories)
    getCategories.mockReturnValue(null as any)
    await expect(() =>
      middlewareFn({
        next: nextFn,
        // @ts-ignore
        payload,
      })
    ).rejects.toThrowError(/Validation/)
    expect(nextFn).not.toHaveBeenCalled()
  })

  it('should throw an error if getCategories returns an invalid async value', async () => {
    middlewareFn = createConsentStampingMiddleware(getCategories)
    getCategories.mockResolvedValue(null as any)
    await expect(() =>
      middlewareFn({
        next: nextFn,
        // @ts-ignore
        payload,
      })
    ).rejects.toThrowError(/Validation/)
    expect(nextFn).not.toHaveBeenCalled()
  })
})
