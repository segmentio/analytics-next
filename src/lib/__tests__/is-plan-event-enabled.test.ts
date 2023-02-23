import { Plan } from '../../core/events/interfaces'
import { isPlanEventEnabled } from '../is-plan-event-enabled'

describe('isPlanEventEnabled', () => {
  it('handles tracking plans that allow unplanned events', () => {
    const plan: Plan['track'] = {
      __default: { enabled: true, integrations: {} },
    }

    expect(isPlanEventEnabled(plan, { enabled: true, integrations: {} })).toBe(
      true
    )
    expect(isPlanEventEnabled(plan, { enabled: false, integrations: {} })).toBe(
      false
    )
    expect(isPlanEventEnabled(plan, undefined)).toBe(true)
  })

  it('handles tracking plans that disallow unplanned events', () => {
    const plan: Plan['track'] = {
      __default: { enabled: false, integrations: {} },
    }

    expect(isPlanEventEnabled(plan, { enabled: true, integrations: {} })).toBe(
      true
    )
    expect(isPlanEventEnabled(plan, { enabled: false, integrations: {} })).toBe(
      false
    )
    expect(isPlanEventEnabled(plan, undefined)).toBe(false)
  })

  it('allows event when tracking plan does not exist', () => {
    expect(isPlanEventEnabled(undefined, undefined)).toBe(true)
  })
})
