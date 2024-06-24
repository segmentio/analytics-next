export const edgeFn = `
//Example "Add To Cart" tracking rule
// function trackAddToCart(signal) {
//   ...
// }
function processSignal(signal) {
  if (signal.type === 'interaction') {
    const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
    analytics.track(eventName, signal.data)
  }
},
`
