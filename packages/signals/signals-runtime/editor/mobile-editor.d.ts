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
	/**
	 * @example 'track' | 'page' | 'screen' | 'identify' | 'group' | 'alias'
	 */
	type: string;
	[key: string]: unknown;
}
type SignalTypes = Signal["type"];
type NavigationAction = "forward" | "backward" | "modal" | "entering" | "leaving" | "page" | "popup";
type NetworkAction = "request" | "response";
type LocalDataAction = "loaded" | "updated" | "saved" | "deleted" | "undefined";
type Signal = InteractionSignal | NavigationSignal | NetworkSignal | LocalDataSignal | InstrumentationSignal | UserDefinedSignal;
interface RawSignal<SignalType extends string> extends BaseSignal {
	type: SignalType;
	anonymousId: string;
	data: any;
	timestamp: string;
	index: any;
}
interface NavigationData {
	action: NavigationAction;
	screen: string;
}
interface NavigationSignal extends RawSignal<"navigation"> {
	data: NavigationData;
}
interface InteractionData {
	component: string;
	info: string;
	data: any;
}
interface InteractionSignal extends RawSignal<"interaction"> {
	type: "interaction";
	data: InteractionData;
}
interface NetworkData {
	action: NetworkAction;
	url: string;
	data: any;
}
interface NetworkSignal extends RawSignal<"network"> {
	data: NetworkData;
}
interface LocalData {
	action: LocalDataAction;
	identifier: string;
	data: string;
}
interface LocalDataSignal extends RawSignal<"localData"> {
	data: LocalData;
}
interface UserDefinedSignal extends RawSignal<"userDefined"> {
	data: any;
}
interface InstrumentationData {
	type: "instrumentation";
	rawEvent: any;
}
interface InstrumentationSignal extends RawSignal<"instrumentation"> {
	data: InstrumentationData;
}
interface MobileSignalsRuntime extends ISignalsRuntime<Signal> {
}



declare const signals: MobileSignalsRuntime
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
  Forward: 'forward'
  Backward: 'backward'
  Modal: 'modal'
  Entering: 'entering'
  Leaving: 'leaving'
  Page: 'page'
  Popup: 'popup'
}

declare const NetworkAction: Readonly<{
  Request: 'request'
  Response: 'response'
}>

declare const LocalDataAction: Readonly<{
  Loaded: 'loaded'
  Updated: 'updated'
  Saved: 'saved'
  Deleted: 'deleted'
  Undefined: 'undefined'
}>
