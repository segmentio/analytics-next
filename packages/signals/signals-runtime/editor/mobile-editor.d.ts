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
type MobileSignalTypes = MobileSignal["type"];
type MobileSignal = MobileInteractionSignal | MobileNavigationSignal | MobileNetworkSignal | MobileLocalDataSignal | MobileInstrumentationSignal | MobileUserDefinedSignal;
interface MobileRawSignal extends BaseSignal {
	anonymousId: string;
	type: string;
	data: any;
	timestamp: string;
	index: any;
}
interface MobileNavigationData {
	action: string;
	screen: string;
}
interface MobileNavigationSignal extends MobileRawSignal {
	data: MobileNavigationData;
}
interface MobileInteractionData {
	component: string;
	info: string;
	data: any;
}
interface MobileInteractionSignal extends MobileRawSignal {
	type: "interaction";
	data: MobileInteractionData;
}
interface MobileNetworkData {
	action: string;
	url: string;
	data: any;
}
interface MobileNetworkSignal extends MobileRawSignal {
	static: "network";
	data: MobileNetworkData;
}
interface MobileLocalData {
	action: string;
	identifier: string;
	data: string;
}
interface MobileLocalDataSignal extends MobileRawSignal {
	type: "localData";
	data: MobileLocalData;
}
interface MobileUserDefinedSignal extends MobileRawSignal {
	type: "userDefined";
	data: any;
}
interface MobileInstrumentationData {
	type: "instrumentation";
	rawEvent: any;
}
interface MobileInstrumentationSignal extends MobileRawSignal {
	data: MobileInstrumentationData;
}



declare const signals: ISignalsRuntime<MobileSignal>
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
