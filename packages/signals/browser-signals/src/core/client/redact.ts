function redact(value: any, maxLength = 8) {
  if (typeof value === 'boolean') {
    return 'true/false'
  }
  if (typeof value === 'number') {
    return Number(value.toString().replace(/[0-9]/g, '9'))
  }
  return value
    .toString()
    .substring(0, maxLength || 99999)
    .replace(/[a-zA-Z]/g, 'X')
    .replace(/[0-9]/g, '9')
}

export function redactJsonValues(
  data: any,
  redactAfterDepth = 0,
  valueMaxLength = 8
): any {
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map((item) =>
        redactJsonValues(item, redactAfterDepth - 1, valueMaxLength)
      )
    } else {
      const redactedData: any = {}
      for (const key in data) {
        redactedData[key] = redactJsonValues(
          data[key],
          redactAfterDepth === 0 ? 0 : redactAfterDepth - 1,
          valueMaxLength
        )
      }
      return redactedData
    }
  } else if (redactAfterDepth <= 0) {
    const ret = redact(data, valueMaxLength)
    return ret
  } else {
    return data
  }
}
