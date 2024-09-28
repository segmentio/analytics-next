export type Compute<T> = { [K in keyof T]: T[K] } & {}
