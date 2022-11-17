export const isValidDate = (date: string) => {
  if (!date) {
    throw new Error('no date found.')
  }
  return !isNaN(Date.parse(date))
}
