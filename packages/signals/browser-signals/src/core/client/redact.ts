function redact(value: any) {
  if (typeof value === 'boolean') {
    return 'true/false'
  }
  if (typeof value === 'number') {
    return 999
  }
  return 'XXXXX'
}

export function redactJsonValues(data: any, redactAfterDepth = 0): any {
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map((item) => redactJsonValues(item, redactAfterDepth - 1))
    } else {
      const redactedData: any = {}
      for (const key in data) {
        redactedData[key] = redactJsonValues(
          data[key],
          redactAfterDepth === 0 ? 0 : redactAfterDepth - 1
        )
      }
      return redactedData
    }
  } else if (redactAfterDepth <= 0) {
    const ret = redact(data)
    return ret
  } else {
    return data
  }
}
