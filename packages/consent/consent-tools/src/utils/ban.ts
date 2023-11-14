/**
 *
 * @param variable - A variable that should not be used
 */
export function ban(variable: unknown): asserts variable is never {
  variable
}
