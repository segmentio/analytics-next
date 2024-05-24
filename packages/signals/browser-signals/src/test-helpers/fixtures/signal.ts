import { Signal } from '../../types'

export const createMockSignal = (): Signal => {
  return {
    type: 'instrumentation',
    data: {
      eventName: 'click',
      target: {} as any,
    },
  }
}
