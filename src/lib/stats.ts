import Stats from '@segment/express-stats'
import { NODE_ENV, DATADOG_AGENT_ADDR } from '../config'
import pkg from '../../package.json'

export default new Stats({
  statsdAddr: DATADOG_AGENT_ADDR,
  tags: [`env:${NODE_ENV}`],
  name: pkg.name,
})
