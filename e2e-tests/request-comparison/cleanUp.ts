import { JSONRequests } from './types'

const cleanUp = (param: JSONRequests): JSONRequests => {
  const reqs: JSONRequests = {
    ...param,
    trackingAPI: param.trackingAPI.map((r) => {
      const postData = { ...r.postData }

      // delete time/date fields
      delete postData.sentAt
      delete postData.timestamp

      // replace randomly generated values
      postData.anonymousId = 'anon'
      postData.messageId = 'messageId'

      if (postData.properties) {
        // ritual.com related key
        postData.properties.key = 'key'

        postData.properties.cart_id = 'cart_id'
        postData.properties.fbp = 'fbp'

        // classpass.com related key
        postData.properties.search_id = 'classpass'

        // hoteltonight related keys
        delete postData.properties.appDidLaunchAt
        delete postData.properties.milliseconds_into_session
        delete postData.properties.udid
        delete postData.properties.request_uuid
        if (
          postData.properties.eligible_due_to_deal &&
          postData.properties.eligible_due_to_deal.every(
            (r: unknown) => !Boolean(r)
          )
        ) {
          postData.properties.eligible_due_to_deal = []
        }
      }

      if (postData.context) {
        // hoteltonight
        delete postData.context.device?.id

        // delete AJSN-only fields
        delete postData.context.metrics
        delete postData.context.attempts

        if (postData.context.traits?.crossDomainId) {
          // randomly generated
          postData.context.traits.crossDomainId = 'crossDomainId'
        }

        if (postData.context.externalIds) {
          postData.context.externalIds.forEach((externalId) => {
            externalId.id = 'random'
          })
        }
      }

      if (postData.traits?.crossDomainId) {
        postData.traits.crossDomainId = 'crossDomainId'
      }

      if (
        postData._metadata?.failedInitializations &&
        postData._metadata.failedInitializations.length === 0
      ) {
        delete postData._metadata.failedInitializations
      }

      // category is covered by ASJNext, but omitted if its value is null
      delete postData.category

      // library will obviously be different (ajs classic vs ajs next)
      delete postData.context.library

      delete r.headers.accept
      delete r.headers.origin
      delete r.headers['user-agent']

      return {
        ...r,
        postData,
      }
    }),
  }

  return reqs
}

export default cleanUp
