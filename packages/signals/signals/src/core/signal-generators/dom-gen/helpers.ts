export const cleanText = (str: string): string => {
  return str
    .replace(/[\r\n\t]+/g, ' ') // Replace newlines and tabs with a space
    .replace(/\s\s+/g, ' ') // Replace multiple spaces with a single space
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with a regular space
    .trim() // Trim leading and trailing spaces
}
