/**
 * Base consent
 */
export abstract class AnalyticsConsentError extends Error {
  /**
   *
   * @param name - Pass the name explicitly to work around the limitation that 'name' is automatically set to the parent class.
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends#using_extends
   * @param message
   */
  constructor(public name: string, message: string) {
    super(message)
  }
}
