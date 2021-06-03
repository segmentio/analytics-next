import fetch from 'unfetch'
import { SegmentEvent } from '../../core/events'

type BatchingConfig = {
  size?: number
  timeout?: number
}

const MAX_PAYLOAD_SIZE = 500

function kilobytes(buffer: unknown): number {
  const size = encodeURI(JSON.stringify(buffer)).split(/%..|./).length - 1
  return size / 1024
}

/**
 * Checks if the payload is over or close to
 * the maximum payload size allowed by tracking
 * API.
 */
function approachingTrackingAPILimit(buffer: unknown): boolean {
  return kilobytes(buffer) >= MAX_PAYLOAD_SIZE - 50
}

export default function batch(apiHost: string, config?: BatchingConfig) {
  let buffer: Array<[string, object]> = []
  let flushing = false

  const limit = config?.size ?? 10
  const timeout = config?.timeout ?? 5000

  function flush(): unknown {
    if (flushing) {
      return
    }

    flushing = true

    const remote = `https://${apiHost}/batch`
    const batch = buffer.map(([_url, blob]) => {
      return blob
    })

    buffer = []
    flushing = false

    const writeKey = (batch[0] as SegmentEvent)?.writeKey
    const authtoken = btoa(writeKey + ':')

    return fetch(remote, {
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authtoken}`,
      },
      method: 'post',
      body: JSON.stringify({ batch }),
    })
  }

  function scheduleFlush(): NodeJS.Timeout {
    return setTimeout(() => {
      if (buffer.length && !flushing) {
        flush()
      }
    }, timeout)
  }

  let schedule = scheduleFlush()

  window.addEventListener('unload', () => {
    flush()
  })

  async function dispatch(url: string, body: object): Promise<unknown> {
    clearTimeout(schedule)
    buffer.push([url, body])

    const bufferOverflow =
      buffer.length >= limit || approachingTrackingAPILimit(buffer)

    if (bufferOverflow && !flushing) {
      flush()
    } else {
      schedule = scheduleFlush()
    }

    return true
  }

  return {
    dispatch,
  }
}
