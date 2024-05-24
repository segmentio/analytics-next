export type SignalType = 'navigation' | 'interaction' | 'instrumentation'

export interface AppSignal<T extends SignalType, Data> {
  type: T
  data: Data
}

type InteractionData = ClickData | SubmitData | ChangeData

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
  [key: string]: unknown
}
export type NavigationSignal = AppSignal<'navigation', NavigationData>

interface InstrumentationData {
  [key: string]: unknown
}
export type InstrumentationSignal = AppSignal<
  'instrumentation',
  InstrumentationData
>

/**
 * Internal signal type
 */
export type Signal =
  | InteractionSignal
  | NavigationSignal
  | InstrumentationSignal

/**
 * Signal sent to the server
 */
export type RawSignal = Signal & {
  anonymousId: string
  timestamp: string
  index: number
}
