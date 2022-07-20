/**
 *  Check if  thenable
 *  (instanceof Promise doesn't respect realms)
 */
export const isThenable = (value: unknown): value is Promise<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  'then' in value &&
  typeof (value as any).then === 'function'
