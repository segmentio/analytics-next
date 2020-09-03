import { EventStore } from './store'

interface AnalyticsSettings {
  writeKey: string
  // TODO:
  // - custom url endpoint
  // - integrations object
  // - plugins
  // - reset
  // - events
  // - event level middleware
}

type Callback = () => {}
const store = new EventStore()

export function analytics(settings: AnalyticsSettings): AnalyticsSettings {
  return settings
}

// TODO/ideas
// - validation layer
// - user id capture
// - meta timestamps
// - add callback as part of dispatch

export async function track(event: string, properties?: object, options?: object, callback?: Callback): Promise<void> {
  const segmentEvent = {
    event,
    type: 'track',
    properties: {
      ...properties,
    },
    options: {
      ...options,
    },
  }

  await store.dispatch(segmentEvent)

  if (callback) {
    callback()
  }
}

export async function identify(userId?: string, traits?: object, options?: object, callback?: Callback): Promise<void> {
  // TODO: validate anon-id

  const segmentEvent = {
    type: 'identify',
    userId,
    traits: {
      ...traits,
    },
    options: {
      ...options,
    },
  }

  await store.dispatch(segmentEvent)

  if (callback) {
    callback()
  }
}
