import { StatsD } from 'node-statsd'

export const statsd = new StatsD({
  host: '172.17.42.1',
  port: 8215,
  global_tags: [`env:ci`],
  prefix: 'analytics-next.',
})
