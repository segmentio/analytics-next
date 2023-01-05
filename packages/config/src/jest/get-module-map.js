const getPackages = require('get-monorepo-packages')
const path = require('path')
// do not map modules in CI to catch any package install bugs (slower)... not in use ATM
const doNotMapPackages = process.env.JEST_SKIP_PACKAGE_MAP === 'true'

/**
 * Create module mapping that resolve packages for ts-jest so typescript compilation happens in-memory
 */
const getJestModuleMap = ({ skipPackageMap = doNotMapPackages } = {}) => {
  /**
   * @param location - e.g. "packages/core"
   */
  const createPackageMappedPath = (location) => {
    const base = path.basename(location) // get base folder name of a package e.g. "core" or "browser"
    return `<rootDir>/../${base}/src/$1`
  }

  // for the sake of getPackages working correctly during a project-wide test run, the working directory must be hardcoded to the root
  const packageRoot = global.JEST_ROOT_CONFIG ? '.' : '../../'
  const packages = getPackages(packageRoot)
  const moduleNameMapper = packages.reduce(
    (acc, el) => ({
      ...acc,
      [`${el.package.name}(.*)$`]: createPackageMappedPath(el.location),
    }),
    {}
  )

  return {
    ...(skipPackageMap ? {} : moduleNameMapper),
  }
}

module.exports = { getJestModuleMap }
