import { ISO_TIMESTAMP_REGEX } from '../../constants'

/**
 * Jest snapshot serializer for ISO 8601 timestamp strings.
 */
export const jestSnapshotSerializerTimestamp: jest.SnapshotSerializerPlugin = {
  test(value: any) {
    return typeof value === 'string' && ISO_TIMESTAMP_REGEX.test(value)
  },
  print() {
    return '<ISO Timestamp>'
  },
}
