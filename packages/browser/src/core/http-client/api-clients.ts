import { HTTPClient } from '.'
import { CDNSettings } from '../../browser'

export async function loadCDNSettings(
  client: HTTPClient,
  { writeKey, baseUrl }: { writeKey: string; baseUrl: string }
): Promise<CDNSettings> {
  return client
    .makeRequest({
      url: `${baseUrl}/v1/projects/${writeKey}/settings`,
      method: 'GET',
    })
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
