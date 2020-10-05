export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogMessage = {
  level: LogLevel
  message: string
  time?: Date
  extras?: object & {
    [key: string]: any
  }
}

export default class Logger {
  private _logs: Record<string, LogMessage> = {}

  log = (level: LogLevel, message: string, extras?: object): void => {
    const time = new Date()
    this._logs[time.toISOString()] = {
      level,
      message,
      time,
      extras,
    }
  }

  public get logs(): LogMessage[] {
    return Object.values(this._logs)
  }

  public flush(): void {
    if (this.logs.length > 1) {
      const formatted = Object.values(this._logs).reduce((logs, log) => {
        const line = {
          ...log,
          json: JSON.stringify(log.extras, null, ' '),
          extras: log.extras,
        }

        delete line['time']

        return {
          ...logs,
          [log.time?.toISOString() ?? '']: line,
        }
      }, {})

      console.table(formatted)
    } else {
      this.logs.forEach((logEntry) => {
        const { level, message, extras } = logEntry

        if (level === 'info' || level === 'debug') {
          console.log(message, extras ?? '')
        } else {
          console[level](message, extras ?? '')
        }
      })
    }

    this._logs = {}
  }
}
