import { Stats } from '..'
import { RemoteMetrics } from '../remote-metrics'

describe(Stats, () => {
  test('forwards increments to remote metrics endpoint', () => {
    const remote = new RemoteMetrics()
    const spy = jest.spyOn(remote, 'increment')

    const stats = new Stats(remote)
    stats.increment('banana', 1, ['phone:1'])

    expect(spy).toHaveBeenCalledWith('banana', ['phone:1'])
  })
})
