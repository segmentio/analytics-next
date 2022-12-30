import { RemoteMetrics } from '../remote-metrics'
import { Stats } from '..'

const spy = jest.spyOn(RemoteMetrics.prototype, 'increment')

describe(Stats, () => {
  test('forwards increments to remote metrics endpoint', () => {
    Stats.initRemoteMetrics()

    const stats = new Stats()
    stats.increment('banana', 1, ['phone:1'])

    expect(spy).toHaveBeenCalledWith('banana', ['phone:1'])
  })
})
