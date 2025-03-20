import { Signal } from '@segment/analytics-signals-runtime'

export function toMatchSignal(
  this: jest.MatcherContext,
  received: Signal,
  expected: Signal
) {
  const cleanSignal = (signal: Signal) => {
    const { timestamp, ...rest } = signal
    return rest
  }

  const pass = this.equals(cleanSignal(received), cleanSignal(expected))
  if (pass) {
    return {
      message: () =>
        `expected ${this.utils.printReceived(
          received
        )} not to match ${this.utils.printExpected(expected)}`,
      pass: true,
    }
  } else {
    return {
      message: () =>
        `expected ${this.utils.printReceived(
          received
        )} to match ${this.utils.printExpected(expected)}`,
      pass: false,
    }
  }
}

/***
 * Add special matcher to compare signals
 * usage:
 * expect(signal).toMatchSignal(expectedSignal)
 */
expect.extend({ toMatchSignal })

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toMatchSignal(expected: Signal): R
    }
  }
}
