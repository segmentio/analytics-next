export class AnalyticsNode {
  static async load(): Promise<never> {
    throw new Error('AnalyticsNode is not available in browsers.')
  }
}
