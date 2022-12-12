import {
  CoreAnalyticsTraits,
  CoreOptions,
  CoreSegmentEvent,
  Callback,
  Integrations,
  Plan,
  TrackPlan,
  PlanEvent,
  JSONArray,
  JSONValue,
  JSONPrimitive,
  JSONObject,
} from '@segment/analytics-core'

export interface Options extends CoreOptions {}

// This is not ideal, but it works with all the edge cases
export interface Traits extends CoreAnalyticsTraits {}

export type EventProperties = Record<string, any>

export interface SegmentEvent extends CoreSegmentEvent {}

export type {
  Integrations,
  Plan,
  TrackPlan,
  PlanEvent,
  Callback,
  JSONArray,
  JSONValue,
  JSONPrimitive,
  JSONObject,
}
