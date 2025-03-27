/**
 * Re-export of tsub.js
 * Created as part of vendoring this dependency 
 * to avoid native build issues with node-gyp.
 */

// We're importing the output of webpack, which creates a CommonJS module
// @ts-ignore
import tsubModule from './tsub.js'
export default tsubModule 