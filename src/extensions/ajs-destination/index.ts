/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Extension } from '../../core/extension'
import { loadScript } from '../../lib/load-script'
import fetch from 'unfetch'

import { Track } from '@segment/facade/dist/track'
import { Identify } from '@segment/facade/dist/identify'
import { Analytics } from '../../index'
import { Emitter } from '../../core/emitter'
import { User } from '../../core/user'
import { Context } from '../../core/context'
import { attempt } from '../../core/queue/delivery'
import { isOffline } from '@/core/connection'

export interface LegacyIntegration extends Emitter {
  analytics?: Analytics
  initialize: () => void
  loaded: () => boolean

  track?: (event: typeof Track) => void | Promise<void>
  identify?: (event: typeof Identify) => void | Promise<void>
}

const path = process.env.LEGACY_INTEGRATIONS_PATH ?? 'https://ajs-next-integrations.s3-us-west-2.amazonaws.com'

async function flushQueue(xt: Extension, queue: Context[]): Promise<Context[]> {
  const failedQueue: Context[] = []

  const attempts = queue.map(async (ctx) => {
    const result = await attempt(ctx, xt)
    const success = result instanceof Context
    if (!success) {
      failedQueue.push(ctx)
    }
  })

  await Promise.all(attempts)
  return failedQueue
}

export function ajsDestination(name: string, version: string, settings?: object): Extension {
  let buffer: Context[] = []
  let flushing = false

  let integration: LegacyIntegration
  let ready = false

  const xt: Extension = {
    name,
    type: 'destination',
    version,

    isLoaded: () => {
      return ready
    },

    load: async (_ctx, analyticsInstance) => {
      await loadScript(`${path}/${name}/${version}/${name}.js`)

      // @ts-ignore
      let integrationBuilder = window[`${name}Integration`]

      // GA and Appcues use a different interface to instantiating integrations
      if (integrationBuilder.Integration) {
        const analyticsStub = {
          user: (): User => analyticsInstance.user(),
          addIntegration: (): void => {},
        }

        integrationBuilder(analyticsStub)
        integrationBuilder = integrationBuilder.Integration
      }

      integration = new integrationBuilder(settings)
      integration.analytics = analyticsInstance
      integration.once('ready', () => {
        ready = true
      })

      integration.initialize()
    },

    async track(ctx) {
      if (!ready || isOffline()) {
        buffer.push(ctx)
        return ctx
      }

      // @ts-ignore
      const trackEvent = new Track(ctx.event, {})

      if (integration.track) {
        await integration.track(trackEvent)
      }

      return ctx
    },

    async identify(ctx) {
      if (!ready || isOffline()) {
        buffer.push(ctx)
        return ctx
      }
      // @ts-ignore
      const trackEvent = new Identify(ctx.event, {})

      if (integration.identify) {
        await integration.identify(trackEvent)
      }

      return ctx
    },
  }

  const scheduleFlush = (): void => {
    if (flushing || isOffline()) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      flushing = true
      buffer = await flushQueue(xt, buffer)
      flushing = false
      scheduleFlush()
    }, Math.random() * 10000)
  }

  scheduleFlush()

  return xt
}

export async function ajsDestinations(writeKey: string): Promise<Extension[]> {
  const [settingsResponse] = await Promise.all([
    fetch(`https://cdn-settings.segment.com/v1/projects/${writeKey}/settings`),
    // loadScript(`${path}/commons/latest/commons.js`),
  ])

  const settings = await settingsResponse.json()
  return Object.entries(settings.integrations).map(([name, settings]) => {
    const integrationName = name.toLowerCase().replace('.', '').replace(/\s+/g, '-')
    return ajsDestination(integrationName, 'latest', settings as object)
  })
}
