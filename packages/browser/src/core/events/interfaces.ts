import {
  CoreTraits,
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
  CoreGroupTraits,
  CoreUserTraits,
} from '@segment/analytics-core'

export interface Options extends CoreOptions {}

export interface Traits extends CoreTraits {}

/**
 * Traits are pieces of information you know about a group.
 * This interface represents reserved traits that Segment has standardized.
 * @link https://segment.com/docs/connections/spec/group/#traits
 */
export interface GroupTraits extends CoreGroupTraits {}

/**
 * Traits are pieces of information you know about a user.
 * This interface represents reserved traits that Segment has standardized.
 * @link https://segment.com/docs/connections/spec/identify/#traits
 */
export interface UserTraits extends CoreUserTraits {}

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
