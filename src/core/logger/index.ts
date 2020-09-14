export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogMessage = {
  level: LogLevel
  message: string
  extras?: object
}

export default class Logger {
  private logs: LogMessage[] = []

  log = (level: LogLevel, message: string, extras?: object): void => {
    this.logs.push({
      level,
      message,
      extras,
    })
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
    this.logs = []
  }
}
