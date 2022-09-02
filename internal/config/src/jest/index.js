const getPackages = require('get-monorepo-packages')

// do not map modules in CI to catch any package install bugs (slower)... not in use ATM
const doNotMapPackages = process.env.JEST_SKIP_PACKAGE_MAP === 'true'

/**
 * Allows ts-jest to dynamically resolve packages so "build"
 */
const getJestModuleMap = (packageRoot = '../../', skipPackageMap = doNotMapPackages) => {

  // get listing of packages in the mono repo
  const createLocation = (name) => {
    return `<rootDir>/./${name}/src/$1`
  }
  const moduleNameMapper = getPackages(packageRoot).reduce(
    (acc, el) => ({
      ...acc,
      [`${el.package.name}(.*)$`]: createLocation(el.location),
    }),
    {}
  )

  return {
    '@/(.+)': '<rootdir>/../../src/$1',
    ...(skipPackageMap ? {}: moduleNameMapper)
  }
}

module.exports = { getJestModuleMap }
