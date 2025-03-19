import {
  NavigationData,
  NavigationSignal,
  UserDefinedSignalData,
  UserDefinedSignal,
  NetworkData,
  NetworkSignalMetadata,
  NetworkSignal,
  SignalTypes,
  Signal,
  SignalOfType,
  InstrumentationSignal,
  InteractionData,
  InteractionSignal,
  SegmentEvent,
} from '@segment/analytics-signals-runtime'
import { normalizeUrl } from '../lib/normalize-url'
import { getPageData } from '../lib/page-data'

type BaseData<T extends SignalTypes> = Omit<
  SignalOfType<Signal, T>['data'],
  'page'
>

/**
 * Base Signal Factory
 */
const createBaseSignal = <
  Type extends SignalTypes,
  Data extends BaseData<Type>
>(
  type: Type,
  data: Data
) => {
  return {
    timestamp: new Date().toISOString(),
    anonymousId: '', // to be set by a middleware (that runs once analytics is instantiated)
    type,
    data: {
      ...data,
      page: getPageData(),
    },
  }
}

export const createInstrumentationSignal = (
  rawEvent: SegmentEvent
): InstrumentationSignal => {
  return createBaseSignal('instrumentation', { rawEvent })
}

export const createInteractionSignal = (
  data: InteractionData
): InteractionSignal => {
  return createBaseSignal('interaction', data)
}

export const createNavigationSignal = (
  data: NavigationData
): NavigationSignal => {
  return createBaseSignal('navigation', data)
}

export const createUserDefinedSignal = (
  data: UserDefinedSignalData
): UserDefinedSignal => {
  return createBaseSignal('userDefined', data)
}

export const createNetworkSignal = (
  data: NetworkData,
  metadata?: NetworkSignalMetadata
): NetworkSignal => {
  return {
    ...createBaseSignal('network', {
      ...data,
      url: normalizeUrl(data.url),
    }),
    metadata: metadata ?? {
      filters: {
        allowed: [],
        disallowed: [],
      },
    },
  }
}
