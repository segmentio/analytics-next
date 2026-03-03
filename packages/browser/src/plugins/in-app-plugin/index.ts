import { Analytics } from '../../core/analytics'
import { Context } from '../../core/context'
import { Plugin } from '../../core/plugin'

import {
  InAppEvents,
  JourneysEvents,
  newEvent,
  allEvents,
  gistToCIO,
  ContentType,
} from './events'
import Gist, { type GistConfig } from 'customerio-gist-web'
import type { InboxAPI, InboxMessage, GistInboxMessage } from './inbox_messages'
import { createInboxAPI } from './inbox_messages'

export { InAppEvents }
export type { InboxAPI, InboxMessage }

export type InAppPluginSettings = {
  siteId: string | undefined
  events: EventListenerOrEventListenerObject | null | undefined

  _env: GistConfig['env'] | undefined
  _logging: GistConfig['logging'] | undefined

  anonymousInApp: boolean | false
}

export function InAppPlugin(settings: InAppPluginSettings): Plugin {
  let _analytics: Analytics
  let _gistLoaded = false
  let _pluginLoaded = false
  const _eventTarget: EventTarget = new EventTarget()

  async function setAnonymousId() {
    const anonymousId = _analytics.user().anonymousId()
    if (anonymousId) {
      await Gist.setCustomAttribute('cio_anonymous_id', anonymousId)
    }
  }

  function attachListeners() {
    if (!_gistLoaded || _pluginLoaded) return

    _analytics.on('reset', reset)

    if (settings.events) {
      allEvents.forEach((event) => {
        _eventTarget.addEventListener(
          event,
          settings?.events as EventListenerOrEventListenerObject
        )
      })
      ;['messageDismissed', 'messageError'].forEach((event) => {
        Gist.events.on(event, (message: any) => {
          _eventTarget.dispatchEvent(
            newEvent(gistToCIO(event), {
              messageId: message.messageId,
              deliveryId: message.properties?.gist?.campaignId,
            })
          )
        })
      })
    }

    Gist.events.on('messageShown', (message: any) => {
      const deliveryId: string = message?.properties?.gist?.campaignId
      if (settings.events) {
        _eventTarget.dispatchEvent(
          newEvent(InAppEvents.MessageOpened, {
            messageId: message?.messageId,
            deliveryId: deliveryId,
            message: {
              dismiss: function () {
                void Gist.dismissMessage(message?.instanceId)
              },
            },
          })
        )
      }
      if (typeof deliveryId !== 'undefined' && deliveryId !== '') {
        void _analytics.track(JourneysEvents.Metric, {
          deliveryId: deliveryId,
          metric: JourneysEvents.Opened,
        })
        return
      }
      let broadcastId: Number =
        message?.properties?.gist?.broadcast?.broadcastIdInt
      if (!broadcastId) {
        broadcastId = message?.properties?.gist?.broadcast?.broadcastId
      }
      if (broadcastId) {
        const templateId = message?.properties?.gist?.broadcast?.templateId
        void _analytics.track(JourneysEvents.Content, {
          actionType: JourneysEvents.ViewedContent,
          contentId: broadcastId,
          templateId: templateId,
          contentType: ContentType,
        })
      }
    })

    Gist.events.on('inboxMessageAction', (params: any) => {
      if (params?.message && params?.action !== '') {
        _handleInboxMessageAction(_analytics, params.message, params.action)
      }
    })

    Gist.events.on('messageAction', (params: any) => {
      const deliveryId: string = params?.message?.properties?.gist?.campaignId
      if (settings.events) {
        _eventTarget.dispatchEvent(
          newEvent(InAppEvents.MessageAction, {
            messageId: params.message.messageId,
            deliveryId: deliveryId,
            action: params.action,
            name: params.name,
            actionName: params.name,
            actionValue: params.action,
            message: {
              dismiss: function () {
                void Gist.dismissMessage(params.message.instanceId)
              },
            },
          })
        )
      }
      if (params.action === 'gist://close') {
        return
      }
      if (typeof deliveryId !== 'undefined' && deliveryId !== '') {
        void _analytics.track(JourneysEvents.Metric, {
          deliveryId: deliveryId,
          metric: JourneysEvents.Clicked,
          actionName: params.name,
          actionValue: params.action,
        })
        return
      }
      let broadcastId: Number =
        params?.message?.properties?.gist?.broadcast?.broadcastIdInt
      if (!broadcastId) {
        broadcastId = params?.message?.properties?.gist?.broadcast?.broadcastId
      }
      if (broadcastId) {
        const templateId: Number =
          params?.message?.properties?.gist?.broadcast?.templateId
        void _analytics.track(JourneysEvents.Content, {
          actionType: JourneysEvents.ClickedContent,
          contentId: broadcastId,
          templateId: templateId,
          contentType: ContentType,
          actionName: params.name,
          actionValue: params.action,
        })
      }
    })

    Gist.events.on('eventDispatched', (gistEvent: any) => {
      if (gistEvent.name === 'analytics:track') {
        const trackEventName: string = gistEvent.payload?.event
        if (typeof trackEventName === 'undefined' || trackEventName === '') {
          return
        }
        void _analytics.track(
          trackEventName,
          gistEvent.payload?.properties,
          gistEvent.payload?.options
        )
      }
    })
  }

  function page(ctx: Context): Context {
    if (!_pluginLoaded) return ctx

    const page: string =
      ctx.event?.properties?.name ?? ctx.event?.properties?.url
    if (typeof page === 'string' && page.length > 0) {
      void Gist.setCurrentRoute(page)
    }

    return ctx
  }

  async function reset(ctx: Context): Promise<Context> {
    await Gist.clearUserToken()
    await Gist.clearCustomAttributes()
    await setAnonymousId()
    return ctx
  }

  async function syncUserToken(ctx: Context): Promise<Context> {
    if (!_gistLoaded) return ctx

    const user = _analytics.user().id()
    if (typeof user === 'string' && user.length > 0) {
      await Gist.setUserToken(user)
    } else {
      await Gist.clearUserToken()
    }
    return ctx
  }

  const customerio: Plugin = {
    name: 'Customer.io In-App Plugin',
    type: 'before',
    version: '0.0.1',
    isLoaded: (): boolean => _pluginLoaded,
    load: async (ctx: Context, instance: Analytics) => {
      _analytics = instance

      if (settings.siteId == null || settings.siteId === '') {
        _error("siteId is required. Can't initialize.")
        return ctx
      }

      await setAnonymousId()

      await Gist.setup({
        siteId: settings.siteId,
        env: settings._env ? settings._env : 'prod',
        logging: settings._logging,
        useAnonymousSession: settings.anonymousInApp,
      })
      _gistLoaded = true

      await syncUserToken(ctx)
      attachListeners()
      ;(instance as any).inbox = (...topics: string[]): InboxAPI => {
        if (!_pluginLoaded) {
          throw new Error(
            'Customer.io In-App Plugin is not loaded yet. Ensure the plugin is initialized before calling inbox().'
          )
        }
        return createInboxAPI(instance, Gist, topics)
      }

      _pluginLoaded = true

      return Promise.resolve()
    },
    identify: syncUserToken,
    page: page,
    unload: () => {
      if (settings.events) {
        allEvents.forEach((event) => {
          _eventTarget.removeEventListener(
            event,
            settings?.events as EventListenerOrEventListenerObject
          )
        })
      }
    },
  }

  return customerio
}

function _handleInboxMessageAction(
  analyticsInstance: Analytics,
  message: GistInboxMessage,
  action: string
) {
  const deliveryId = message?.deliveryId
  if (
    action === 'opened' &&
    typeof deliveryId !== 'undefined' &&
    deliveryId !== ''
  ) {
    void analyticsInstance.track(JourneysEvents.Metric, {
      deliveryId: message.deliveryId,
      metric: JourneysEvents.Opened,
    })
  }
}

function _error(msg: string) {
  console.error(`[Customer.io In-App Plugin] ${msg}`)
}
