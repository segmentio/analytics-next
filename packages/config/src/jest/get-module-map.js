const getPackages = require('get-monorepo-packages')
const appRootPath = require('app-root-path')
const path = require('path')

/**
 * Create module mapping that resolve packages for ts-jest so typescript compilation happens in-memory
 */
const getJestModuleMap = (configDirname, isRootConfig) => {
  // for the sake of getPackages working correctly during a project-wide test run, the working directory must be hardcoded to the root
  const packageRoot = isRootConfig
    ? '.'
    : path.relative(configDirname, appRootPath.path)

  const packages = getPackages(configDirname, packageRoot)

  const createPackageMappedPath = (packagePath) => {
    const pathToMappedPackage = path.relative(configDirname, packagePath)
    // alert: yes, this _does_ expect all modules to be in src, and it's completely ignorant of export maps.
    const result = `<rootDir>/${pathToMappedPackage}/src/$1`
    return result
  }

  const moduleMap = packages.reduce(
    (acc, pkg) => ({
      ...acc,
      [`${pkg.package.name}(.*)$`]: createPackageMappedPath(pkg.location),
    }),
    {}
  )

  return moduleMap
}

module.exports = { getJestModuleMap }
