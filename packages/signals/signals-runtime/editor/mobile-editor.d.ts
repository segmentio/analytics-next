/* eslint-disable */
// These types will be used in the segment app UI for autocomplete
// Generated from: @segment/analytics-signals-runtime@0.0.0
foo

 declare interface BaseSignal {
    type: string;
}

 declare const EventType: Readonly<{
    Track: "track";
    Page: "page";
    Screen: "screen";
    Identify: "identify";
    Group: "group";
    Alias: "alias";
}>;

declare interface InstrumentationData {
    type: 'instrumentation';
    rawEvent: any;
}

declare interface InstrumentationSignal extends RawSignal<'instrumentation'> {
    data: InstrumentationData;
}

declare interface InteractionData {
    component: string;
    info: string;
    data: any;
}
asfas
declare interface InteractionSignal extends RawSignal<'interaction'> {
    type: 'interaction';
    data: InteractionData;
}

/**
 * Interface for the Signals class (accessible via `signals` in the processSignal scope).
 */
 declare interface ISignalsRuntime<Signal extends BaseSignal> {
    /**
     * Finds a signal of a specific type from a given signal.
     *
     * SignalType - The type of the signal to find.
     * @param fromSignal - The signal to search from.
     * @param signalType - The type of the signal to find.
     * @param predicate - Optional predicate function to filter the signals.
     * @returns The found signal of the specified type, or undefined if not found.
     */
    find: <SignalType extends Signal['type']>(fromSignal: Signal, signalType: SignalType, predicate?: (signal: SignalOfType<Signal, SignalType>) => boolean) => SignalOfType<Signal, SignalType> | undefined;
    /**
     * Filters signals of a specific type from a given signal.
     * SignalType - The type of the signals to filter.
     * @param fromSignal - The signal to search from.
     * @param signalType - The type of the signals to filter.
     * @param predicate - Optional predicate function to filter the signals.
     * @returns An array of signals of the specified type.
     */
    filter: <SignalType extends Signal['type']>(fromSignal: Signal, signalType: SignalType, predicate?: (signal: SignalOfType<Signal, SignalType>) => boolean) => SignalOfType<Signal, SignalType>[];
}

 declare type JSONArray = JSONValue[];

 declare type JSONObject = {
    [member: string]: JSONValue;
};

 declare type JSONPrimitive = string | number | boolean | null;

 declare type JSONValue = JSONPrimitive | JSONObject | JSONArray;

declare interface LocalData {
    action: LocalDataActionName;
    identifier: string;
    data: string;
}

 declare const LocalDataAction: Readonly<{
    Loaded: "loaded";
    Updated: "updated";
    Saved: "saved";
    Deleted: "deleted";
    Undefined: "undefined";
}>;

 declare type LocalDataActionName = 'loaded' | 'updated' | 'saved' | 'deleted' | 'undefined';

declare interface LocalDataSignal extends RawSignal<'localData'> {
    data: LocalData;
}

 declare class MobileSignalsRuntime extends SignalsRuntime<Signal> {
    private signalCounter;
    private maxBufferSize;
    constructor(signals?: Signal[]);
    add: (signal: Signal) => void;
    getNextIndex: () => number;
}

 declare const NavigationAction: Readonly<{
    Forward: "forward";
    Backward: "backward";
    Modal: "modal";
    Entering: "entering";
    Leaving: "leaving";
    Page: "page";
    Popup: "popup";
}>;

 declare type NavigationActionName = 'forward' | 'backward' | 'modal' | 'entering' | 'leaving' | 'page' | 'popup';

declare interface NavigationData {
    action: NavigationActionName;
    screen: string;
}

declare interface NavigationSignal extends RawSignal<'navigation'> {
    data: NavigationData;
}

 declare const NetworkAction: Readonly<{
    Request: "request";
    Response: "response";
}>;

 declare type NetworkActionName = 'request' | 'response';

declare interface NetworkData {
    action: NetworkActionName;
    url: string;
    data: any;
}

declare interface NetworkSignal extends RawSignal<'network'> {
    data: NetworkData;
}

declare interface RawSignal<SignalType extends string> extends BaseSignal {
    type: SignalType;
    anonymousId: string;
    data: any;
    timestamp: string;
    index: any;
}

 declare interface SegmentEvent {
    /**
     * @example 'track' | 'page' | 'screen' | 'identify' | 'group' | 'alias'
     */
    type: string;
    [key: string]: unknown;
}

 declare type Signal = InteractionSignal | NavigationSignal | NetworkSignal | LocalDataSignal | InstrumentationSignal | UserDefinedSignal;

 declare type SignalOfType<AllSignals extends BaseSignal, SignalType extends AllSignals['type']> = AllSignals & {
    type: SignalType;
};

 declare const signals: MobileSignalsRuntime;

/**
 * Base class that provides runtime utilities for signals.
 */
declare abstract class SignalsRuntime<Signal extends BaseSignal = BaseSignal> implements ISignalsRuntime<Signal> {
    signalBuffer: Signal[];
    constructor(signals?: Signal[]);
    /**
     * Finds a signal of a specific type from a given signal.
     *
     * SignalType - The type of the signal to find.
     * @param fromSignal - The signal to search from.
     * @param signalType - The type of the signal to find.
     * @param predicate - Optional predicate function to filter the signals.
     * @returns The found signal of the specified type, or undefined if not found.
     */
    find: <SignalType extends Signal["type"]>(fromSignal: Signal, signalType: SignalType, predicate?: ((signal: SignalOfType<Signal, SignalType>) => boolean) | undefined) => SignalOfType<Signal, SignalType> | undefined;
    /**
     * Filters signals of a specific type from a given signal.
     * SignalType - The type of the signals to filter.
     * @param fromSignal - The signal to search from.
     * @param signalType - The type of the signals to filter.
     * @param predicate - Optional predicate function to filter the signals.
     * @returns An array of signals of the specified type.
     */
    filter: <SignalType extends Signal["type"]>(fromSignal: Signal, signalType: SignalType, predicate?: ((signal: SignalOfType<Signal, SignalType>) => boolean) | undefined) => SignalOfType<Signal, SignalType>[];
}

 declare const SignalType: Readonly<{
    Interaction: "interaction";
    Navigation: "navigation";
    Network: "network";
    LocalData: "localData";
    Instrumentation: "instrumentation";
    UserDefined: "userDefined";
}>;

 declare type SignalTypes = Signal['type'];

declare interface UserDefinedSignal extends RawSignal<'userDefined'> {
    data: any;
}

