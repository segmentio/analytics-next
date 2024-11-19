import { Signal } from '@segment/analytics-signals-runtime'

export const redactSignalData = (signalArg: Signal): Signal => {
  const signal = structuredClone(signalArg)
  if (signal.type === 'interaction') {
    if (
      'target' in signal.data &&
      signal.data.target &&
      typeof signal.data.target === 'object'
    ) {
      if ('value' in signal.data.target) {
        signal.data.target.value = redactJsonValues(signal.data.target.value)
      }
      if ('formData' in signal.data.target) {
        signal.data.target.formData = redactJsonValues(
          signal.data.target.formData
        )
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
