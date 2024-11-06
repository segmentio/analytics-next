// types/factories.ts

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

/**
 * Factories
 */
export const createInstrumentationSignal = (
  rawEvent: SegmentEvent
): InstrumentationSignal => {
  return {
    type: 'instrumentation',
    data: {
      rawEvent,
    },
  }
}

export const createInteractionSignal = (
  data: InteractionData
): InteractionSignal => {
  return {
    type: 'interaction',
    data,
  }
}

export const createNavigationSignal = (
  data: NavigationData
): NavigationSignal => {
  return {
    type: 'navigation',
    data,
  }
}

export const createUserDefinedSignal = (
  data: UserDefinedSignalData
): UserDefinedSignal => {
  return {
    type: 'userDefined',
    data,
  }
}

export const createNetworkSignal = (
  data: NetworkData,
  metadata: NetworkSignalMetadata
): NetworkSignal => {
  return {
    type: 'network',
    data: {
      ...data,
      url: normalizeUrl(data.url),
    },
    metadata: metadata,
  }
}
