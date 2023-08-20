import { ValidationError } from './validation-error'

export function assertIsFunction(
  val: unknown,
  variableName: string
): asserts val is Function {
  if (typeof val !== 'function') {
    throw new ValidationError(`${variableName} is not a function`, val)
  }
}

export function assertIsObject(
  val: unknown,
  variableName = 'value'
): asserts val is object {
  if (val === null || typeof val !== 'object') {
    throw new ValidationError(`${variableName} is not an object`, val)
  }
}
