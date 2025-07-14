/**
 * analytics.track("name", { prop1: "value" }, {fooCtx: '123'});
 */
export type TrackArgs = [
  name: string,
  properties: Record<string, unknown> | undefined,
  context: Record<string, unknown> | undefined
]

/**
 * analytics.identify("userId", { trait1: "value" }, {fooCtx: '123'});
 */
export type IdentifyArgs = [
  userId: string | undefined,
  traits: Record<string, unknown> | undefined,
  context: Record<string, unknown> | undefined
]

/**
 * analytics.page("name", "category", { prop1: "value" }, {fooCtx: '123'})
 */
export type PageArgs = [
  name: string | undefined,
  category: string | undefined,
  properties: Record<string, unknown> | undefined,
  context: Record<string, unknown> | undefined
]

/**
 * analytics.screen("name", "category", { prop1: "value" }, {fooCtx: '123'});
 */
export type ScreenArgs = [
  name: string | undefined,
  category: string | undefined,
  properties: Record<string, unknown> | undefined,
  context: Record<string, unknown> | undefined
]

/**
 * analytics.group("groupId", { trait1: "value" }, {fooCtx: '123'});
 */
export type GroupArgs = [
  groupId: string | undefined,
  traits: Record<string, unknown> | undefined,
  context: Record<string, unknown> | undefined
]

/**
 * analytics.alias("userId", "previousId", {fooCtx: '123'});
 */
export type AliasArgs = [
  userId: string,
  previousId: string | undefined, // from
  context: Record<string, unknown> | undefined
]
