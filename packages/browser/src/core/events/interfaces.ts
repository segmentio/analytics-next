import {
  CoreOptions,
  CoreCustomerioEvent,
  Callback,
  Integrations,
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
} from '@customerio/cdp-analytics-core'

export interface Options extends CoreOptions { }

export type { GroupTraits, UserTraits, Traits }

export type EventProperties = Record<string, any>

export interface CustomerioEvent extends CoreCustomerioEvent { }

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
