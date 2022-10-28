import autocannon from 'autocannon'

export const runAutocannon = (
  url = 'http://localhost:3000'
): Promise<autocannon.Result> => {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url,
      },
      (err, result) => {
        if (err) {
          console.error(err)
          reject(err)
        }
        resolve(result)
      }
    )
    autocannon.track(instance, { renderProgressBar: true })
  })
}
