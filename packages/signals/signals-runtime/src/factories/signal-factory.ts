import {
  InstrumentationSignal,
  InteractionData,
  InteractionSignal,
  NavigationData,
  NavigationSignal,
  UserDefinedSignalData,
  UserDefinedSignal,
  NetworkData,
  NetworkSignal,
} from '../types/web'

interface SegmentEvent {
  type: string // e.g 'track'
  [key: string]: any
}

/**
 * Factories
 */
export const createInstrumentationSignal = (
  rawEvent: SegmentEvent
): InstrumentationSignal => {
  return {
    type: 'instrumentation',
    data: {
      rawEvent: rawEvent,
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

export const createNetworkSignal = (data: NetworkData): NetworkSignal => {
  return {
    type: 'network',
    data,
  }
}
