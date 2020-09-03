import { SegmentEvent } from '../events'
import Stats from '../stats'
import uuid from 'uuid-random'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export class Context {
  private _event: SegmentEvent
  private sealed: boolean

  constructor(event: SegmentEvent) {
    this._event = event
    this.event.messageId = event.messageId ?? uuid()
  }

  cancel = (): never => {
    throw new Error('Stap!')
  }

  seal = (): void => {
    this.sealed = true
  }

  log = (level: LogLevel, message: string, extras?: object): void => {
    if (level === 'info' || level === 'debug') {
      console.log(message, extras)
    } else {
      console[level](message, extras)
    }
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

  public get messageId(): string | undefined {
    return this.event.messageId
  }

  stats = new Stats()
}
