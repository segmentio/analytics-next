import { assertNotAny, assertIs } from '../../test-helpers/type-assertions'
import { pick } from '../pick'

{
  // should work with literals
  const res = pick({ id: 123 }, ['id'])

  assertIs<{ id: number }>(res)
  assertNotAny(res)
}
{
  // should work if only keys are read-only
  const obj: { id?: number } = {}
  const res = pick(obj, ['id'] as const)
  assertNotAny(res)
  assertIs<{ id?: number }>(res)

  // @ts-expect-error
  assertIs<{ id: number }>(res)
}

{
  // should work with keys as string
  const res = pick({ id: 123 }, [] as string[])
  assertNotAny(res)

  assertIs<Partial<{ id: number }>>(res)
  // @ts-expect-error - should be partial
  assertIs<{ id: number }>(res)
}

{
  // should work with object type
  const res = pick({} as object, ['id'])
  assertNotAny(res)
  assertIs<object>(res)
  // @ts-expect-error
  assertIs<{ id: any }>(res)
}
