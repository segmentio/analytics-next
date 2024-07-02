function obfuscate(value: any) {
  console.log(value, typeof value)
  if (value === null || typeof value === 'undefined') {
    return '__null'
  }
  if (typeof value === 'boolean') {
    return '__boolean'
  }
  if (typeof value === 'number') {
    return '__number'
  }
  return '__string'
}

export function obfuscateJsonValues(data: any, obfuscateAfterDepth = 0): any {
  if (data === null) {
    return obfuscate(data)
  }
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map((item) =>
        obfuscateJsonValues(item, obfuscateAfterDepth - 1)
      )
    } else {
      const obfuscateedData: any = {}
      for (const key in data) {
        obfuscateedData[key] = obfuscateJsonValues(
          data[key],
          obfuscateAfterDepth === 0 ? 0 : obfuscateAfterDepth - 1
        )
      }
      return obfuscateedData
    }
  } else if (obfuscateAfterDepth <= 0) {
    const ret = obfuscate(data)
    return ret
  } else {
    return data
  }
}
