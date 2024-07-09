/**
 * This is the entry point to a webpack bundle that can be loaded via a <script /> tag
 */
import { SignalsPlugin } from './index'
export { SignalsPlugin } // in case someone wants to use the umd module directly

if (typeof window !== 'undefined') {
  ;(window as any).SignalsPlugin = SignalsPlugin
}
