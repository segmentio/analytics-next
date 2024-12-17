export const cleanText = (str: string): string => {
  return str
    .replace(/[\r\n\t]+/g, ' ') // Replace newlines and tabs with a space
    .replace(/\s\s+/g, ' ') // Replace multiple spaces with a single space
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with a regular space
    .trim() // Trim leading and trailing spaces
}

// Check if a subset object is a partial match of another object
export const isObjectMatch = <Obj extends Record<string, any>>(
  partialObj: Partial<Obj>,
  mainObj: Obj
): boolean => {
  return Object.keys(partialObj).every(
    (key) => partialObj[key as keyof Obj] === mainObj[key as keyof Obj]
  )
}
