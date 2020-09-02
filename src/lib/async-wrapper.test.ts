import asyncWrapper from './async-wrapper'

test('asyncWrapper passes errors to express', async (): Promise<void> => {
  const error = new Error('test')
  const middleware = asyncWrapper(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (): Promise<void> => {
      throw error
    }
  )
  const next = jest.fn()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await middleware({} as any, {} as any, next)

  expect(next).toBeCalledWith(error)
})
