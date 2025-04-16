export enum InAppEvents {
    MessageOpened = 'in-app:message-opened',
    MessageDismissed =  'in-app:message-dismissed',
    MessageError = 'in-app:message-error',
    MessageAction = 'in-app:message-action',
    MessageVisible = 'in-app:message-visible'
}

export const allEvents:string[] = Object.values(InAppEvents);

export enum JourneysEvents {
    Metric = 'Report Delivery Event',
    Content = 'Report Content Event',
    Opened = 'opened',
    Clicked = 'clicked',
    ViewedContent = 'viewed_content',
    ClickedContent = 'clicked_content'
}

export const ContentType = 'in_app_content'

export function newEvent(type:string, detail:any): CustomEvent {
    return new CustomEvent(type, { detail })
}

export function gistToCIO(gistEvent:string): string {
    switch (gistEvent) {
        case 'messageShown':
            return InAppEvents.MessageOpened;
        case 'messageDismissed':
            return InAppEvents.MessageDismissed;
        case 'messageError':
            return InAppEvents.MessageError;
        case 'messageAction':
            return InAppEvents.MessageAction;
        case 'messageVisible':
            return InAppEvents.MessageVisible;
        default:
            return "";
    }
}
