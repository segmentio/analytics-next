import Knobs from '@segment/knobs-node'
import { CONSUL_ADDR, NODE_ENV } from '../config'
import pkg from '../../package.json'

const [hostname, port] = CONSUL_ADDR.split(':')

export default new Knobs({
  serviceName: pkg.name,
  host: hostname,
  port,
  testMode: NODE_ENV === 'test',
})
