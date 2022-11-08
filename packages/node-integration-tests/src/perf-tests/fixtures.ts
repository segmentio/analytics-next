import crypto from 'crypto'

export const trackEventSmall = {
  userId: '019mr8mf4r',
  event: 'Order Completed',
  properties: { userId: 'foo', event: 'click' },
}

export const trackEventLarge = {
  ...trackEventSmall,
  properties: {
    ...trackEventSmall.properties,
    data: crypto.randomBytes(1024 * 6).toString(),
  },
}
