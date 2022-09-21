const getPackages = require('get-monorepo-packages')

// do not map modules in CI to catch any package install bugs (slower)... not in use ATM
const doNotMapPackages = process.env.JEST_SKIP_PACKAGE_MAP === 'true'

/**
 * Create module mapping that resolve packages for ts-jest so typescript compilation happens in-memory
 *
 */
const getJestModuleMap = ({ skipPackageMap = doNotMapPackages } = {}) => {
  // get listing of packages in the mono repo

  /**
   * @param location - e.g. "packages/core"
   */

  const createPackageMappedPath = (location) => {
    // if packageRoot is the global jest file (using projects), our mappers suddenly need
    // to be relative to each project -- I have no idea why, seems unintuitive.
    // If not root config, equiv to running "yarn test" in an individual package repo (rootDir will be the root package.json)
    const moduleBasePath = global.JEST_ROOT_CONFIG
      ? '<rootDir>/../..'
      : '<rootDir>'
    return `${moduleBasePath}/${location}/src/$1`
  }
  // for the sake of getPackages working correctly during a project-wide test run, the working directory must be hardcoded to the root
  const packageRoot = global.JEST_ROOT_CONFIG ? '.' : '../../'
  const moduleNameMapper = getPackages(packageRoot).reduce(
    (acc, el) => ({
      ...acc,
      [`${el.package.name}(.*)$`]: createPackageMappedPath(el.location),
    }),
    {}
  )

  return {
    '@/(.+)': '<rootDir>/src/$1',
    ...(skipPackageMap ? {} : moduleNameMapper),
  }
}

module.exports = { getJestModuleMap }
