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
	type: EventType;
	[key: string]: any;
}
type EventType = "track" | "page" | "screen" | "identify" | "group" | "alias";
type SignalTypes = Signal["type"];
interface RawSignal<T extends SignalTypes, Data> extends BaseSignal {
	type: T;
	data: Data;
	metadata?: Record<string, any>;
}
type InteractionData = ClickData | SubmitData | ChangeData;
interface SerializedTarget {
	[key: string]: any;
}
type ClickData = {
	eventType: "click";
	target: SerializedTarget;
};
type SubmitData = {
	eventType: "submit";
	submitter: SerializedTarget;
};
type ChangeData = {
	eventType: "change";
	[key: string]: unknown;
};
type InteractionSignal = RawSignal<"interaction", InteractionData>;
interface BaseNavigationData<ActionType extends string> {
	action: ActionType;
	url: string;
	hash: string;
}
interface URLChangeNavigationData extends BaseNavigationData<"urlChange"> {
	prevUrl: string;
}
interface PageChangeNavigationData extends BaseNavigationData<"pageLoad"> {
}
type NavigationData = URLChangeNavigationData | PageChangeNavigationData;
type NavigationSignal = RawSignal<"navigation", NavigationData>;
interface InstrumentationData {
	rawEvent: unknown;
}
type InstrumentationSignal = RawSignal<"instrumentation", InstrumentationData>;
interface NetworkSignalMetadata {
	filters: {
		allowed: string[];
		disallowed: string[];
	};
}
interface BaseNetworkData {
	action: string;
	url: string;
	data: JSONValue;
}
interface NetworkRequestData extends BaseNetworkData {
	action: "request";
	url: string;
	method: string;
}
interface NetworkResponseData extends BaseNetworkData {
	action: "response";
	url: string;
}
type NetworkData = NetworkRequestData | NetworkResponseData;
type NetworkSignal = RawSignal<"network", NetworkData>;
interface UserDefinedSignalData {
	[key: string]: any;
}
type UserDefinedSignal = RawSignal<"userDefined", UserDefinedSignalData>;
type Signal = InteractionSignal | NavigationSignal | InstrumentationSignal | NetworkSignal | UserDefinedSignal;



declare const signals: ISignalsRuntime<Signal>
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
