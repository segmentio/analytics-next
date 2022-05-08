type AllSettledResult<T> = {
  status: 'fulfilled' | 'rejected'
  reason?: Error
  value?: T
}

// promise.allSettled "polyfill"
export const allSettled = <T>(
  promises: Promise<T>[]
): Promise<AllSettledResult<T>[]> => {
  return Promise.all(
    promises.map((promise) => {
      // Per spec, Promise.allSettled([Promise.reject('oops'), 2] ->
      // [{status: "rejected", reason: "oops"}, { "status": "fulfilled", "value": 2 }}
      return Promise.resolve(promise)
        .then(
          (value) =>
            ({
              value,
              status: 'fulfilled',
            } as AllSettledResult<T>)
        )
        .catch(
          (reason) =>
            ({
              reason,
              status: 'rejected',
            } as AllSettledResult<T>)
        )
    })
  )
}
