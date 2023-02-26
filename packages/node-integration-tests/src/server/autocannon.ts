import autocannon from 'autocannon'

export type RunAutocannonOptions = Partial<autocannon.Options>

export const runAutocannon = (
  options: RunAutocannonOptions = {}
): Promise<autocannon.Result> => {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: options.url || 'http://localhost:3000',
        ...options,
      },
      (err, result) => {
        if (err) {
          console.error(err)
          reject(err)
        }
        resolve(result)
      }
    )
    autocannon.track(instance, {
      renderProgressBar: true,
      renderResultsTable: false,
      renderLatencyTable: false,
    })
  })
}
