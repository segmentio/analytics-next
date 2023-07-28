import { CDNSettings } from '../../../types'

/**
 *  Assert integrations/remote plugins contain only the given integrations
 */
export const assertIntegrationsContainOnly = (
  /**
   * integration creation names
   */
  creationNames: string[],
  /**
   * mock CDN settings
   */
  originalCDNSettings: CDNSettings,
  /**
   * updated CDN settings
   */
  updatedCDNSettings: CDNSettings
) => {
  expect(updatedCDNSettings.remotePlugins).toEqual(
    originalCDNSettings.remotePlugins?.filter((p) =>
      // enabled consent
      creationNames.includes(p.creationName)
    )
  )

  // integrations should also be filtered
  const integrations = Object.fromEntries(
    Object.entries(originalCDNSettings.integrations).filter(
      ([creationName]) => {
        return [...creationNames, 'Segment.io'].includes(creationName)
      }
    )
  )

  expect(updatedCDNSettings.integrations).toEqual(integrations)
}
