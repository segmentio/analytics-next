// Default value will be updated to 'web' in `bundle-umd.ts` for web build.
let _version: 'web' | 'npm' = 'npm'

export function setVersionType(version: typeof _version) {
  _version = version
}

export function getVersionType(): typeof _version {
  return _version
}
