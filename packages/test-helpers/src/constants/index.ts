/**
 * Matches an ISO 8601 timestamp string.
 * @example
 * expect('2022-01-01T00:00:00.000Z').toEqual(expect.any(ISO_TIMESTAMP_REGEX))
 */
export const ISO_TIMESTAMP_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
