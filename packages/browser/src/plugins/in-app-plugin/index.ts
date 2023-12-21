import { Analytics } from '../../core/analytics'
import { Context } from '../../core/context'
import { Plugin } from '../../core/plugin'

import { InAppEvents, SemanticEvents, newEvent, allEvents, gistToCIO } from './events'
import Gist from 'customerio-gist-web'

export { InAppEvents }

export type InAppPluginSettings = {
    siteId: string | undefined
    events: EventListenerOrEventListenerObject | null | undefined

    _env: string | undefined
    _logging: boolean | undefined
}

export function InAppPlugin(
    settings: InAppPluginSettings,
  ): Plugin {

    let _analytics: Analytics;
    let _gistLoaded:boolean = false;
    let _pluginLoaded:boolean = false;
    const _eventTarget:EventTarget = new EventTarget();

    function attachListeners() {
        if(!_gistLoaded || _pluginLoaded)
            return;

        _analytics.on('reset', reset);

        if(settings.events) {
            allEvents.forEach((event) => {
                _eventTarget.addEventListener(event, settings?.events as EventListenerOrEventListenerObject);
            });
            ['messageShown', 'messageDismissed', 'messageError'].forEach((event) => {
                Gist.events.on(event, (message: any) => {
                    _eventTarget.dispatchEvent(newEvent(gistToCIO(event), { 
                        messageId: message.messageId,
                        deliveryId: message.properties?.gist?.campaignId,
                    }));
                });
            });
        }

        Gist.events.on('messageShown', (message: any) => {
            const deliveryId:string = message?.properties?.gist?.campaignId;
            if (typeof deliveryId != 'undefined' && deliveryId != '') {
                _analytics.track(SemanticEvents.JourneyMetric, {
                    'deliveryId': deliveryId,
                    'metric': SemanticEvents.Opened,
                });
            }
        });

        Gist.events.on('messageAction', (params: any) => {
            const deliveryId:string = params?.message?.properties?.gist?.campaignId;
            if (params.action != 'gist://close' && typeof deliveryId != 'undefined' && deliveryId != '') {
                _analytics.track(SemanticEvents.JourneyMetric, {
                    'deliveryId': deliveryId,
                    'metric': SemanticEvents.Clicked,
                    'actionName': params.name,
                    'actionValue': params.action,
                });
            }
            settings.events && _eventTarget.dispatchEvent(newEvent(InAppEvents.MessageAction, {
                messageId: params.message.messageId,
                deliveryId: deliveryId,
                action: params.action,
                name: params.name,
                actionName: params.name,
                actionValue: params.action,
                message:{
                    dismiss: function() {
                        Gist.dismissMessage(params?.message?.instanceId);
                    }
                }
             }));
        });
    }

    async function page(ctx: Context): Promise<Context> {
        if(!_pluginLoaded)
            return ctx;

        const page:string = ctx.event?.properties?.name ?? ctx.event?.properties?.url;
        if(typeof page === 'string' && page.length > 0) {
            Gist.setCurrentRoute(page);
        }

        return ctx;
    }

    async function reset(ctx: Context): Promise<Context> {
        await Gist.clearUserToken();
        return ctx;
    }
    
    async function syncUserToken(ctx: Context): Promise<Context> {
        if(!_gistLoaded)
            return ctx;

        const user = _analytics.user().id();
        if (typeof user === 'string' && user.length > 0) {
            await Gist.setUserToken(user);
        } else {
            await Gist.clearUserToken();
        }
        return ctx;
    }

    const customerio: Plugin = {
        name: 'Customer.io In-App Plugin',
        type: 'before',
        version: '0.0.1',
        isLoaded: (): boolean => _pluginLoaded,
        load: async (ctx: Context, instance: Analytics) => {
            _analytics = instance;

            if(settings.siteId == null || settings.siteId == "") {
                _error("siteId is required. Can't initialize.")
                return ctx;
            }

            await Gist.setup({
                siteId: settings.siteId, 
                env: settings._env? settings._env : "prod",
                logging: settings._logging,
            });
            _gistLoaded = true;

            await syncUserToken(ctx);
            attachListeners();

            _pluginLoaded = true;

            return Promise.resolve();
        },
        identify: syncUserToken,
        page: page,
        unload: async () => {
            if(settings.events) {
                allEvents.forEach((event) => {
                    _eventTarget.removeEventListener(event, settings?.events as EventListenerOrEventListenerObject);
                });
            }
        },
    }

  return customerio;
}

function _error(msg: string) {
    console.error(`[Customer.io In-App Plugin] ${msg}`)
}