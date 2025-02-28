import {
  InstrumentationSignal,
  InteractionData,
  InteractionSignal,
  NavigationData,
  NavigationSignal,
  UserDefinedSignalData,
  UserDefinedSignal,
  NetworkData,
  NetworkSignalMetadata,
  NetworkSignal,
  SegmentEvent,
} from '@segment/analytics-signals-runtime'
import { normalizeUrl } from '../lib/normalize-url'
import { getPageData } from '../lib/page-data'

/**
 * Factories
 */
export const createInstrumentationSignal = (
  rawEvent: SegmentEvent
): InstrumentationSignal => {
  return {
    type: 'instrumentation',
    data: {
      page: getPageData(),
      rawEvent,
    },
  }
}

export const createInteractionSignal = (
  data: InteractionData
): InteractionSignal => {
  return {
    type: 'interaction',
    data: {
      ...data,
      page: getPageData(),
    },
  }
}

export const createNavigationSignal = (
  data: NavigationData
): NavigationSignal => {
  return {
    type: 'navigation',
    data: {
      ...data,
      page: getPageData(),
    },
  }
}

export const createUserDefinedSignal = (
  data: UserDefinedSignalData
): UserDefinedSignal => {
  return {
    type: 'userDefined',
    data: {
      ...data,
      page: getPageData(),
    },
  }
}

export const createNetworkSignal = (
  data: NetworkData,
  metadata?: NetworkSignalMetadata
): NetworkSignal => {
  return {
    type: 'network',
    data: {
      ...data,
      url: normalizeUrl(data.url),
      page: getPageData(),
    },
    metadata: metadata ?? {
      filters: {
        allowed: [],
        disallowed: [],
      },
    },
  }
}
