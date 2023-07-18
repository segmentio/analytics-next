import { OneTrustGlobal } from '../../lib/onetrust-api'
/**
 * It's OK to declare ambient globals in test code, but not in library code
 */
export declare global {
  interface Window {
    OneTrust: OneTrustGlobal
    OnetrustActiveGroups: string
  }
}
