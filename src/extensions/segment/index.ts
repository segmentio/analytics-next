import { Extension } from '../../core/extension'
import { ajsDestination } from '../ajs-destination'

export function segment(settings?: object): Extension {
  return ajsDestination('segmentio', 'latest', settings)
}
