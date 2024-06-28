import { InteractionSignal } from '../../types'

export const createMockSignal = (): InteractionSignal => {
  return {
    type: 'interaction',
    data: {
      eventType: 'click',
      target: {} as any,
    },
  }
}
