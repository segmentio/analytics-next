/**
 * This file is meant to be used to create a webpack bundle.
 */
import { withOneTrust } from './index'
export { withOneTrust }

// this will almost certainly be executed in the browser, but since this is UMD,
// we are checking just for the sake of being thorough
if (typeof window !== 'undefined') {
  ;(window as any).withOneTrust = withOneTrust
}
