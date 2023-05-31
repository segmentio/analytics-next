import { NavigatorUAData, UADataValues } from './interfaces'

export async function clientHints(
  hints?: string[]
): Promise<UADataValues | undefined> {
  const userAgentData = (navigator as any).userAgentData as
    | NavigatorUAData
    | undefined

  if (!userAgentData) return undefined

  if (!hints) return userAgentData.toJSON()
  return userAgentData
    .getHighEntropyValues(hints)
    .catch(() => userAgentData.toJSON())
}
