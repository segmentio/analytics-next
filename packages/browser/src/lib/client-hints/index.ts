export async function clientHints(
  hints?: string[]
): Promise<UADataValues | undefined> {
  const userAgentData = ((): NavigatorUAData | undefined =>
    (navigator as any).userAgentData)()

  if (!userAgentData) return

  let userAgentDataContext: UADataValues = {
    brands: userAgentData.brands,
    mobile: userAgentData.mobile,
    platform: userAgentData.platform,
  }

  if (hints) {
    try {
      // this also includes the low entropy values, so we can overwrite here
      userAgentDataContext = await userAgentData.getHighEntropyValues(hints)
    } catch (_) {
      return userAgentDataContext
    }
  }

  return userAgentDataContext
}
