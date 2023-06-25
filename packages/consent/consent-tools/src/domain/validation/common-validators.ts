import { ValidationError } from './validation-error'

export function assertIsFunction(
  val: unknown,
  variableName: string
): asserts val is Function {
  if (typeof val !== 'function') {
    throw new ValidationError(`${variableName} is not function`, val)
  }
}

export function assertIsObject(
  val: unknown,
  variableName: string
): asserts val is object {
  if (typeof val !== 'object') {
    throw new ValidationError(`${variableName} is not an object`, val)
  }
}
