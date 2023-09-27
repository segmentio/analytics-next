import { pick } from '../../lib/pick'
import { EventProperties, SegmentEvent } from '../events'
import { getDefaultPageContext } from './get-page-context'

/**
 * Augments a segment event with information about the current page.
 * Page information like URL changes frequently, so this is meant to be captured as close to the event call as possible.
 * Things like `userAgent` do not change, so they can be added later in the flow.
 * We prefer not to add this information to this function, as it increases the main bundle size.
 */
export const addPageContext = (
  event: SegmentEvent,
  pageCtx = getDefaultPageContext()
): void => {
  const evtCtx = event.context! // Context should be set earlier in the flow
  let pageContextFromEventProps: Pick<EventProperties, string> | undefined
  if (event.type === 'page') {
    pageContextFromEventProps =
      event.properties && pick(event.properties, Object.keys(pageCtx))

    event.properties = {
      ...pageCtx,
      ...event.properties,
      ...(event.name ? { name: event.name } : {}),
    }
  }

  evtCtx.page = {
    ...pageCtx,
    ...pageContextFromEventProps,
    ...evtCtx.page,
  }
}
