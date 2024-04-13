import {
  CDNSettings,
  DestinationMiddlewareFunction,
  AnyAnalytics,
  MaybeInitializedAnalytics,
  SourceMiddlewareFunction,
} from '../types'
import {
  shouldEnableIntegrationHelper,
  DeviceModeFilterSettings,
  segmentShouldBeDisabled,
} from './blocking-helpers'
import { logger } from './logger'
import { parseAllCategories } from './pruned-categories'

// Block all device mode destinations
export const addBlockingMiddleware = (
  cdnSettingsP: Promise<CDNSettings>,
  analyticsInstance: AnyAnalytics | MaybeInitializedAnalytics,
  filterSettings: DeviceModeFilterSettings
) => {
  const blockDeviceMode: DestinationMiddlewareFunction = async ({
    integration: creationName,
    payload,
    next,
  }) => {
    const cdnSettings = await cdnSettingsP
    const eventCategoryPreferences =
      payload.obj.context.consent!.categoryPreferences
    const disabled = !shouldEnableIntegrationHelper(
      creationName,
      cdnSettings,
      eventCategoryPreferences,
      filterSettings
    )

    logger.debug(`Destination middleware called: ${creationName}`, {
      DROPPED: disabled,
      categoryPreferences: eventCategoryPreferences,
      payload: payload.obj,
      filterSettings,
    })

    if (disabled) return null

    next(payload)
  }
  analyticsInstance.addDestinationMiddleware('*', blockDeviceMode)

  // Block segment itsel (Segment.io isn't currently allowed in addDestinationMiddleware)
  const blockSegmentAndEverythingElse: SourceMiddlewareFunction = async ({
    payload,
    next,
  }) => {
    const cdnSettings = await cdnSettingsP
    const eventCategoryPreferences =
      payload.obj.context.consent!.categoryPreferences

    const consentSettings = filterSettings.integrationCategoryMappings
      ? {
          hasUnmappedDestinations: false,
          allCategories: parseAllCategories(
            filterSettings.integrationCategoryMappings
          ),
        }
      : cdnSettings.consentSettings

    const disabled = segmentShouldBeDisabled(
      eventCategoryPreferences,
      consentSettings
    )

    logger.debug('Source middleware called', {
      DROPPED: disabled,
      categoryPreferences: eventCategoryPreferences,
      payload: payload.obj,
      filterSettings,
      consentSettings,
    })

    if (disabled) return null
    next(payload)
  }
  analyticsInstance.addSourceMiddleware(blockSegmentAndEverythingElse)
}
