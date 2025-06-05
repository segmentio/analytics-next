import {
  CoreOptions,
  CoreSegmentEvent,
  Callback,
  Plan,
  TrackPlan,
  PlanEvent,
  JSONArray,
  JSONValue,
  JSONPrimitive,
  JSONObject,
  GroupTraits,
  UserTraits,
  BaseUserTraits,
  Traits,
} from '@segment/analytics-core'

export interface Options extends CoreOptions {}

export type { GroupTraits, UserTraits, Traits, BaseUserTraits }

export type EventProperties = Record<string, any>

export interface SegmentEvent extends CoreSegmentEvent {}

export type {
  Plan,
  TrackPlan,
  PlanEvent,
  Callback,
  JSONArray,
  JSONValue,
  JSONPrimitive,
  JSONObject,
}
