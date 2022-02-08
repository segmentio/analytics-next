import {
  Alias,
  Facade,
  Group,
  Identify,
  Options,
  Page,
  Screen,
  Track,
} from '@segment/facade'
import { SegmentEvent } from '../core/events'

export type SegmentFacade = Facade<SegmentEvent> & {
  obj: SegmentEvent
}

interface Properties {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface ClonedObj {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const convertClassesToObjects = (
  properties: Properties,
  tmp: ClonedObj = {}
) => {
  if (typeof properties !== 'object') return properties
  if (Object.prototype.toString.call(properties) === '[object Object]') {
    if (
      properties.constructor !== Object &&
      typeof properties.constructor === 'function'
    ) {
      tmp = { ...properties }
      for (const key in properties) {
        // eslint-disable-next-line no-prototype-builtins
        if (properties.hasOwnProperty(key) && tmp[key] !== properties[key]) {
          tmp[key] = convertClassesToObjects(properties[key])
        }
      }
    } else {
      for (const key in properties) {
        if (key === '__proto__') {
          Object.defineProperty(tmp, key, {
            value: convertClassesToObjects(properties[key]),
            configurable: true,
            enumerable: true,
            writable: true,
          })
        } else {
          tmp[key] = convertClassesToObjects(properties[key])
        }
      }
    }
  }
  return tmp
}

export function toFacade(evt: SegmentEvent, options?: Options): SegmentFacade {
  if (evt.properties) {
    evt.properties = convertClassesToObjects(evt.properties)
  }
  let fcd = new Facade(evt, options)

  if (evt.type === 'track') {
    fcd = new Track(evt, options)
  }

  if (evt.type === 'identify') {
    fcd = new Identify(evt, options)
  }

  if (evt.type === 'page') {
    fcd = new Page(evt, options)
  }

  if (evt.type === 'alias') {
    fcd = new Alias(evt, options)
  }

  if (evt.type === 'group') {
    fcd = new Group(evt, options)
  }

  if (evt.type === 'screen') {
    fcd = new Screen(evt, options)
  }

  Object.defineProperty(fcd, 'obj', {
    value: evt,
    writable: true,
  })

  return fcd as SegmentFacade
}
