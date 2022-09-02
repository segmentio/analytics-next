const getPackages = require('get-monorepo-packages')

const getJestModuleMap = (packageRoot) => {
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
  return moduleNameMapper
}

module.exports = { getJestModuleMap }