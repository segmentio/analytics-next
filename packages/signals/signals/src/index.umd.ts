/**
 * This is the entry point to a webpack bundle that can be loaded via a <script /> tag
 */
import { SignalsPlugin } from './index'
export { SignalsPlugin } // in case someone wants to use the umd module directly

// this will almost certainly be executed in the browser, but since this is UMD,
// we are checking just for the sake of being thorough
if (typeof window !== 'undefined') {
  ;(window as any).SignalsPlugin = SignalsPlugin
}
