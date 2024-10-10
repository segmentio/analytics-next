/* These types will be used in the segment app UI for autocomplete */
/* eslint-disable */


interface BaseSignal {
	type: string;
}
type SignalOfType<AllSignals extends BaseSignal, SignalType extends AllSignals["type"]> = AllSignals & {
	type: SignalType;
};
interface ISignalsRuntime<Signal extends BaseSignal> {
	find: <SignalType extends Signal["type"]>(fromSignal: Signal, signalType: SignalType, predicate?: (signal: SignalOfType<Signal, SignalType>) => boolean) => SignalOfType<Signal, SignalType> | undefined;
}
type JSONPrimitive = string | number | boolean | null;
type JSONValue = JSONPrimitive | JSONObject | JSONArray;
type JSONObject = {
	[member: string]: JSONValue;
};
type JSONArray = JSONValue[];
interface SegmentEvent {
	type: string;
	[key: string]: any;
}
type WebSignalTypes = WebSignal["type"];
interface WebAppSignal<T extends WebSignalTypes, Data> extends BaseSignal {
	type: T;
	data: Data;
	metadata?: Record<string, any>;
}
type WebInteractionData = WebClickData | WebSubmitData | WebChangeData;
interface WebSerializedTarget {
	[key: string]: any;
}
type WebClickData = {
	eventType: "click";
	target: WebSerializedTarget;
};
type WebSubmitData = {
	eventType: "submit";
	submitter: WebSerializedTarget;
};
type WebChangeData = {
	eventType: "change";
	[key: string]: unknown;
};
type WebInteractionSignal = WebAppSignal<"interaction", WebInteractionData>;
interface WebBaseNavigationData<ActionType extends string> {
	action: ActionType;
	url: string;
	hash: string;
}
interface WebURLChangeNavigationData extends WebBaseNavigationData<"urlChange"> {
	prevUrl: string;
}
interface WebPageChangeNavigationData extends WebBaseNavigationData<"pageLoad"> {
}
type WebNavigationData = WebURLChangeNavigationData | WebPageChangeNavigationData;
type WebNavigationSignal = WebAppSignal<"navigation", WebNavigationData>;
interface WebInstrumentationData {
	rawEvent: unknown;
}
type WebInstrumentationSignal = WebAppSignal<"instrumentation", WebInstrumentationData>;
interface WebNetworkSignalMetadata {
	filters: {
		allowed: string[];
		disallowed: string[];
	};
}
interface WebBaseNetworkData {
	action: string;
	url: string;
	data: JSONValue;
}
interface WebNetworkRequestData extends WebBaseNetworkData {
	action: "request";
	url: string;
	method: string;
}
interface WebNetworkResponseData extends WebBaseNetworkData {
	action: "response";
	url: string;
}
type WebNetworkData = WebNetworkRequestData | WebNetworkResponseData;
type WebNetworkSignal = WebAppSignal<"network", WebNetworkData>;
interface WebUserDefinedSignalData {
	[key: string]: any;
}
type WebUserDefinedSignal = WebAppSignal<"userDefined", WebUserDefinedSignalData>;
type WebSignal = WebInteractionSignal | WebNavigationSignal | WebInstrumentationSignal | WebNetworkSignal | WebUserDefinedSignal;



declare const signals: ISignalsRuntime<WebSignal>
declare const SignalType: {
  Interaction: 'interaction'
  Navigation: 'navigation'
  Network: 'network'
  LocalData: 'localData'
  Instrumentation: 'instrumentation'
  UserDefined: 'userDefined'
}
declare const EventType: {
  Track: 'track'
  Page: 'page'
  Screen: 'screen'
  Identify: 'identify'
  Group: 'group'
  Alias: 'alias'
}
declare const NavigationAction: {
  URLChange: 'urlChange'
  PageLoad: 'pageLoad'
}
