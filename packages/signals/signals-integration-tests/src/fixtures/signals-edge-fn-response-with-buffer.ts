// This is messy, with comments _intentionally_, in order to approximate the actual response
// get from: https://cdn.edgefn.segment.com/5oHRsJg99bT5j7tNTSYCfV/125eb487-795a-467a-968e-2bf7385fce20.js
export const edgeFn = `
//Example "Add To Cart" tracking rule
// function trackAddToCart(signal) {
//   if (signal.type == SignalType.Interaction && signal.data.title == "Add To Cart") {

//     var properties = new Object()
//     let network = signals.find(signal, SignalType.Network, (signal) => {
//             return signal.data.action === NetworkAction.Response
// 		})
//       if (network) {
//         properties.price = network.data.data.content.price
//         properties.currency = network.data.data.content.currency ?? "USD"
//         properties.productId = network.data.data.content.id
//         properties.productName = network.data.data.content.title
//       }

//     analytics.track(signal.data.title, properties)
//   }
// }

/**
 * This function processSignal(signal) MUST exist in the rule.
 */

const processSignal = (signal) => {
  if (signal.type === 'interaction') {
    const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
    analytics.track(eventName, signal.data)
  } else if (signal.type === 'instrumentation') {
    const found = signals.find(
      signal,
      'interaction',
      (s) => s.data.eventType === 'change'
    )
    if (found) {
      console.log('found in the buffer!', found.data)
      analytics.track('found in the buffer!', found.data)
    }
  }
}
`
