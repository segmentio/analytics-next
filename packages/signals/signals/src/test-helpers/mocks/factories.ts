import { TargetedHTMLElement } from '@segment/analytics-signals-runtime'

export const createMockTarget = (
  partialTarget: Partial<TargetedHTMLElement> = {}
): TargetedHTMLElement => {
  return {
    attributes: {},
    classList: [],
    id: 'test',
    labels: [],
    ...partialTarget,
  }
}
