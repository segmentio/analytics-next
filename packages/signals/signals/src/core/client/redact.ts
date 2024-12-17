import { Signal } from '@segment/analytics-signals-runtime'

/**
 * This is a very imperfect redaction.
 * Issues:
 *  - innerText could contain sensitive data, and be leaked depending
 */
export const redactSignalData = (signalArg: Signal): Signal => {
  const signal = structuredClone(signalArg)
  if (signal.type === 'interaction') {
    if (
      'target' in signal.data &&
      signal.data.target &&
      typeof signal.data.target === 'object'
    ) {
      if (
        'value' in signal.data.target &&
        signal.data.target.value !== undefined
      ) {
        signal.data.target.value = redactJsonValues(signal.data.target.value)
      }
      if (
        'checked' in signal.data.target &&
        signal.data.target.checked !== undefined
      ) {
        signal.data.target.checked = redactJsonValues(
          signal.data.target.checked
        )
      }

      if ('formData' in signal.data.target) {
        signal.data.target.formData = redactJsonValues(
          signal.data.target.formData
        )
      }

      if (signal.data.eventType === 'change') {
        if ('change' in signal.data) {
          signal.data.change = redactJsonValues(signal.data.change)
        }

        if (signal.data.listener === 'mutation') {
          if ('innerText' in signal.data.target) {
            signal.data.target.innerText = redactJsonValues(
              signal.data.target.innerText
            )
          }
          if ('textContent' in signal.data.target) {
            signal.data.target.textContent = redactJsonValues(
              signal.data.target.textContent
            )
          }
          if ('attributes' in signal.data.target) {
            signal.data.target.attributes = redactJsonValues(
              signal.data.target.attributes
            )
          }
        }

        if (signal.data.listener === 'contenteditable') {
          if ('textContent' in signal.data.target) {
            signal.data.target.textContent = redactJsonValues(
              signal.data.target.textContent
            )
          }
          if ('innerText' in signal.data.target) {
            signal.data.target.innerText = redactJsonValues(
              signal.data.target.innerText
            )
          }
        }
      }
    }
  } else if (signal.type === 'network') {
    signal.data = redactJsonValues(signal.data, 2)
  }
  return signal
}

function redactPrimitive(value: unknown) {
  const type = typeof value
  if (type === 'boolean') {
    return true
  }

  if (['number', 'bigint'].includes(type)) {
    return 999
  }

  if (value === undefined || value === null) {
    return value
  }

  return 'XXX'
}

export function redactJsonValues(data: unknown, redactAfterDepth = 0): any {
  if (typeof data === 'object' && data) {
    if (Array.isArray(data)) {
      return data.map((item) => redactJsonValues(item, redactAfterDepth - 1))
    } else {
      const redactedData: any = {}
      for (const key in data) {
        redactedData[key] = redactJsonValues(
          // @ts-ignore
          data[key],
          redactAfterDepth === 0 ? 0 : redactAfterDepth - 1
        )
      }
      return redactedData
    }
  } else if (redactAfterDepth <= 0) {
    const ret = redactPrimitive(data)
    return ret
  } else {
    return data
  }
}
