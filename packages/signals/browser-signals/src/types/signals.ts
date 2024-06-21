export type SignalType = 'navigation' | 'interaction' | 'instrumentation'

export interface AppSignal<T extends SignalType, Data> {
  type: T
  data: Data
}

export type InteractionData = ClickData | SubmitData | ChangeData

interface SerializedTarget {
  // nodeName: Node['nodeName']
  // textContent: Node['textContent']
  // nodeValue: Node['nodeValue']
  // nodeType: Node['nodeType']
  [key: string]: any
}

type ClickData = {
  eventType: 'click'
  target: SerializedTarget
}

type SubmitData = {
  eventType: 'submit'
  submitter: SerializedTarget
}

type ChangeData = {
  eventType: 'change'
  [key: string]: unknown
}

export type InteractionSignal = AppSignal<'interaction', InteractionData>

interface NavigationData {
  action: 'pageLoad' | 'urlChange'
  url: string
  hash: string
  [key: string]: unknown
}
export type NavigationSignal = AppSignal<'navigation', NavigationData>

interface InstrumentationData {
  rawEvent: unknown
}
export type InstrumentationSignal = AppSignal<
  'instrumentation',
  InstrumentationData
>

export type SignalOfType<T extends SignalType> = T extends 'interaction'
  ? InteractionSignal
  : T extends 'navigation'
  ? NavigationSignal
  : T extends 'instrumentation'
  ? InstrumentationSignal
  : never
/**
 * Internal signal type
 */
export type Signal =
  | InteractionSignal
  | NavigationSignal
  | InstrumentationSignal

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
