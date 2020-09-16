import { SegmentEvent } from '../events'
import Logger, { LogLevel, LogMessage } from '../logger'
import Stats from '../stats'
import { set } from 'lodash'

export interface AbstractContext {
  cancel: () => never
  seal: () => void
  log: (level: LogLevel, message: string, extras?: object) => void
  stats: Stats
}

export class Context implements AbstractContext {
  private _event: SegmentEvent
  private sealed = false
  public logger = new Logger()

  constructor(event: SegmentEvent) {
    this._event = event
  }

  static system(): Context {
    return new Context({ type: 'track', event: 'init' })
  }

  cancel = (): never => {
    throw new Error('Stap!')
  }

  seal = (): void => {
    this.sealed = true
  }

  log = (level: LogLevel, message: string, extras?: object): void => {
    this.logger.log(level, message, extras)
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

  public updateEvent(path: string, value: any): void {
    if (this.sealed) {
      this.log('warn', 'Context is sealed')
      return
    }

    set(this._event, path, value)
  }

  public logs(): LogMessage[] {
    return this.logger.logs
  }

  public flush(): void {
    this.logger.flush()
    this.stats.flush()
  }

  stats = new Stats()
}
