import { getCDN } from './parse-cdn'

export const fetchCDNSettings = <CDNSettings = any>(
  writeKey: string,
  cdnURL?: string
): Promise<CDNSettings> => {
  const baseUrl = cdnURL ?? getCDN()

  return fetch(`${baseUrl}/v1/projects/${writeKey}/settings`)
    .then((res) => {
      if (!res.ok) {
        return res.text().then((errorResponseMessage) => {
          throw new Error(errorResponseMessage)
        })
      }
      return res.json()
    })
    .catch((err) => {
      console.error(err.message)
      throw err
    })
}
