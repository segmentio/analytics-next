import { Logger } from 'ecs-logs-js'
import { NODE_ENV, LOG_LEVEL } from '../config'

const logger = new Logger({
  level: LOG_LEVEL,
  devMode: NODE_ENV === 'development',
})

export default logger
