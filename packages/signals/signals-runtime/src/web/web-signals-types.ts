import { BaseSignal, JSONValue } from '../shared/shared-types'

export type SignalTypes = Signal['type']

export interface PageData {
  /**
   * The full URL of the page
   * If there is a canonical URL, this should be the canonical URL
   * @example https://www.segment.com/docs/connections/sources/catalog/libraries/website/javascript/
   */
  url: string
  /**
   * The path of the page
   * @example /docs/connections/sources/catalog/libraries/website/javascript/
   */
  path: string
  /**
   * The search parameters of the page
   * @example ?utm_source=google
   */
  search: string
  /**
   * The hostname of the page
   * @example www.segment.com
   */
  hostname: string
  /**
   * The hash of the page
   * @example #hash
   */
  hash: string
  /**
   * The referrer of the page
   * @example https://www.google.com/
   */
  referrer: string
  /**
   * The title of the page
   * @example Segment - Documentation
   */
  title: string
}

/**
 * The base data that all web signal data must have
 */
export interface BaseWebData {
  page: PageData
}

export interface RawSignal<T extends SignalTypes, Data> extends BaseSignal {
  type: T
  data: BaseWebData & Data
  metadata?: Record<string, any>
}
export type InteractionData = ClickData | SubmitData | ChangeData

export type ParsedAttributes = { [attributeName: string]: string | null }

export interface TargetedHTMLElement {
  id: string
  attributes: ParsedAttributes
  [key: string]: any
}

type ClickData = {
  eventType: 'click'
  target: TargetedHTMLElement
}

type SubmitData = {
  eventType: 'submit'
  submitter?: TargetedHTMLElement
  target: TargetedHTMLElement
}

export type ChangeData = {
  eventType: 'change'
  /**
   * The target element that changed.
   */
  target: TargetedHTMLElement
  /**
   * The name/type of "listener" that triggered the change.
   * Elements can change due to a variety of reasons, such as a mutation, a change event, or a contenteditable change
   */
  listener: 'contenteditable' | 'onchange' | 'mutation'
  /**
   * The change that occurred -- this is a key-value object of the change that occurred
   * For mutation listeners, this is the attributes that changed
   * For contenteditable listeners, this is the text that changed
   * @example
   * ```ts
   * { checked: true } // onchange
   * { value: 'new value' } // onchange / mutation
   * {'aria-selected': 'true' } // mutation
   * { textContent: 'Sentence1\nSentence2\n' } // contenteditable
   * ```
   */
  change: JSONValue
}

export type InteractionSignal = RawSignal<'interaction', InteractionData>

interface BaseNavigationData<ActionType extends string> {
  action: ActionType
  url: string
  hash: string
}

export interface URLChangeNavigationData
  extends BaseNavigationData<'urlChange'> {
  prevUrl: string
}

export interface PageChangeNavigationData
  extends BaseNavigationData<'pageLoad'> {}

export type NavigationData = URLChangeNavigationData | PageChangeNavigationData

export type NavigationSignal = RawSignal<'navigation', NavigationData>

interface InstrumentationData {
  rawEvent: unknown
}
export type InstrumentationSignal = RawSignal<
  'instrumentation',
  InstrumentationData
>

export interface NetworkSignalMetadata {
  filters: {
    allowed: string[]
    disallowed: string[]
  }
}

interface BaseNetworkData {
  action: string
  url: string
  data: JSONValue
  contentType: string
}

interface NetworkRequestData extends BaseNetworkData {
  action: 'request'
  url: string
  method: HTTPMethod
}

interface NetworkResponseData extends BaseNetworkData {
  action: 'response'
  url: string
  status: number
  ok: boolean
}

export type HTTPMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'

export type NetworkData = NetworkRequestData | NetworkResponseData

export type NetworkSignal = RawSignal<'network', NetworkData>

export interface UserDefinedSignalData {
  [key: string]: any
}

export type UserDefinedSignal = RawSignal<'userDefined', UserDefinedSignalData>

export type Signal =
  | InteractionSignal
  | NavigationSignal
  | InstrumentationSignal
  | NetworkSignal
  | UserDefinedSignal
