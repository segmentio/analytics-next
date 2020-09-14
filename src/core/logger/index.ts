export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogMessage = {
  level: LogLevel
  message: string
  extras?: object
}

export default class Logger {
  private _logs: LogMessage[] = []

  log = (level: LogLevel, message: string, extras?: object): void => {
    const time = new Date()
    this._logs.push({
      level,
      message,
      extras: {
        ...extras,
        time,
      },
    })
  }

  public get logs(): LogMessage[] {
    return this._logs
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
    this._logs = []
  }
}
