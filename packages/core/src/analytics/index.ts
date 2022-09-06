import { CoreContext } from '../context'

export interface CoreAnalytics {
  track(...args: unknown[]): Promise<CoreContext>
  page(...args: unknown[]): Promise<CoreContext>
  identify(...args: unknown[]): Promise<CoreContext>
  group(...args: unknown[]): Promise<CoreContext>
  alias(...args: unknown[]): Promise<CoreContext>
  screen(...args: unknown[]): Promise<CoreContext>
  register(...plugins: unknown[]): Promise<CoreContext>
  deregister(...plugins: unknown[]): Promise<CoreContext>
  readonly VERSION: string
}
