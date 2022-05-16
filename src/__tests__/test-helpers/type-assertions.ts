type IsAny<T> = unknown extends T ? (T extends {} ? T : never) : never
type NotAny<T> = T extends IsAny<T> ? never : T
type NotUnknown<T> = unknown extends T ? never : T

type NotTopType<T> = NotAny<T> & NotUnknown<T>

// this is not meant to be run, just for type tests
export function assertNotAny<T>(val: NotTopType<T>) {
  console.log(val)
}

// this is not meant to be run, just for type tests
export function assertIs<T extends SomeType, SomeType = any>(val: T) {
  console.log(val)
}
