const fs = require('fs')
const path = require('path')

/**
 * Create parent directories if they don't exist
 */
function mkdirp(filepath) {
  const dirname = path.dirname(filepath)
  if (!fs.existsSync(dirname)) {
    mkdirp(dirname)
    fs.mkdirSync(dirname)
  }
}

exports.outputFile = function outputFile(filepath, data) {
  mkdirp(filepath)
  fs.writeFileSync(filepath, data)
}

/**
 * Create a TypeScript declaration file for vendored modules
 * This is a cheat at the moment -- it just exports the namespace
 * and contains no types.
 */
exports.outputDts = function outputDts(filepath, namespace) {
  const contents = `declare namespace ${namespace} {
  export interface Store {
    new(rules?: any[]): Store
    getRulesByDestinationName(destinationName: string): any[]
  }

  export function matches(obj: any, matcher: any): boolean
  export function transform(obj: any, transformers: any[]): any
  export function Store(rules?: any[]): Store
}

declare module '@segment/tsub' {
  export = ${namespace}
}
`
  exports.outputFile(filepath, contents)
} 