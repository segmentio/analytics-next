import {
  CoreOptions,
  CoreSegmentEvent,
  Callback,
  IntegrationsOptions,
  Plan,
  TrackPlan,
  PlanEvent,
  JSONArray,
  JSONValue,
  JSONPrimitive,
  JSONObject,
  GroupTraits,
  UserTraits,
  Traits,
} from '@segment/analytics-core'

export interface Options extends CoreOptions {}

export type { GroupTraits, UserTraits, Traits }

export type EventProperties = Record<string, any>

export interface SegmentEvent extends CoreSegmentEvent {}

export type {
  IntegrationsOptions,
  Plan,
  TrackPlan,
  PlanEvent,
  Callback,
  JSONArray,
  JSONValue,
  JSONPrimitive,
  JSONObject,
}
