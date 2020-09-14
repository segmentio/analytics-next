import { SegmentEvent } from '../events'
import Stats from '../stats'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogMessage = {
  level: LogLevel
  message: string
  extras?: object
}

export interface Ctx {
  cancel: () => never
  seal: () => void
  log: (level: LogLevel, message: string, extras?: object) => void
  stats: Stats
}

export class Context implements Ctx {
  private _event: SegmentEvent
  private sealed = false
  private logs: LogMessage[] = []

  constructor(event: SegmentEvent) {
    this._event = event
  }

  cancel = (): never => {
    throw new Error('Stap!')
  }

  seal = (): void => {
    this.sealed = true
  }

  log = (level: LogLevel, message: string, extras?: object): void => {
    this.logs.push({
      level,
      message,
      extras,
    })
  }

  public get event(): SegmentEvent {
    return this._event
  }

  public set event(evt: SegmentEvent) {
    if (this.sealed) {
      this.log('warn', 'Context is sealed')
      return
    }

    this._event = Object.assign({}, this._event, evt)
  }

  public flush(): void {
    this.logs.forEach((logEntry) => {
      const { level, message, extras } = logEntry
      if (level === 'info' || level === 'debug') {
        console.log(message, extras ?? '')
      } else {
        console[level](message, extras ?? '')
      }
    })

    this.stats.flush()
  }

  stats = new Stats()
}
