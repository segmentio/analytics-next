import standard from './fetch-dispatcher'

type BatchingConfig = {
  size?: number
  timeout?: number
}

export default function batch(apiHost: string, config?: BatchingConfig) {
  const { dispatch: fetch } = standard()

  let buffer: Array<[string, object]> = []
  let flushing = false

  const limit = config?.size ?? 10
  const timeout = config?.timeout ?? 5000

  function flush(): unknown {
    if (flushing) {
      return
    }

    flushing = true

    const remote = `https://${apiHost}/b`
    const batch = buffer.map(([_url, blob]) => {
      return blob
    })

    buffer = []
    flushing = false

    return fetch(remote, batch)
  }

  function scheduleFlush(): void {
    setTimeout(() => {
      if (buffer.length && !flushing) {
        flush()
      }
      scheduleFlush()
    }, timeout)
  }

  scheduleFlush()

  window.addEventListener('unload', () => {
    flush()
  })

  async function dispatch(url: string, body: object): Promise<unknown> {
    buffer.push([url, body])

    if (buffer.length >= limit && !flushing) {
      flush()
    }

    return true
  }

  return {
    dispatch,
  }
}
