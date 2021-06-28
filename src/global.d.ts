declare module 'dset' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export default function dset<T>(object: T, keys: string, val: any): void
}
