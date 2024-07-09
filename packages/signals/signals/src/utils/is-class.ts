export const isClass = (value: any): value is NewableFunction => {
  return (
    typeof value === 'function' && value.prototype.constructor !== undefined
  )
}
