import {
  NavigationData,
  NavigationSignal,
  UserDefinedSignalData,
  UserDefinedSignal,
  NetworkData,
  NetworkSignal,
  SignalType,
  Signal,
  SignalOfType,
  InstrumentationSignal,
  InteractionData,
  InteractionSignal,
  SegmentEvent,
  EventType,
} from '@segment/analytics-signals-runtime'
import { normalizeUrl } from '../lib/normalize-url'
import { getPageData } from '../lib/page-data'

type BaseData<T extends SignalType> = Omit<
  SignalOfType<Signal, T>['data'],
  'page'
>

/**
 * Base Signal Factory
 */
const createBaseSignal = <Type extends SignalType, Data extends BaseData<Type>>(
  type: Type,
  data: Data
) => {
  return {
    index: undefined, // This will get overridden by a middleware that runs once analytics is instantiated
    timestamp: new Date().toISOString(),
    anonymousId: '', // to be set by a middleware (that runs once analytics is instantiated)
    type,
    context: {
      library: {
        name: '@segment/analytics-next',
        version: '0.0.0',
      },
      signalsRuntime: '',
    },
    data: {
      ...data,
      page: getPageData(),
    },
  }
}

export const createInstrumentationSignal = (
  rawEvent: SegmentEvent
): InstrumentationSignal => {
  return createBaseSignal('instrumentation', {
    rawEvent,
    type: rawEvent.type as EventType,
  })
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

export const createNetworkSignal = (data: NetworkData): NetworkSignal => {
  return {
    ...createBaseSignal('network', {
      ...data,
      url: normalizeUrl(data.url),
    }),
  }
}
