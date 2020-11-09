declare module 'component-url' {
  function parse(
    url: string
  ): {
    hash: string
    host: string
    port: number
    hostname: string
    href: string
    pathname: string
    protocol: string
    query: string
    search: string
  }
}

declare module 'dset' {
  export default function dset<T>(object: T, keys: string, val: any): void
}

declare module '@segment/facade/dist/facade' {
  import { SegmentEvent } from '@/core/events'

  export class Facade {
    constructor(
      obj: SegmentEvent,
      opts: {
        clone: boolean | undefined
        traverse: boolean | undefined
      }
    )
    opts: {
      clone?: boolean | undefined
      traverse?: boolean | undefined
    }
    obj: SegmentEvent
  }
}
