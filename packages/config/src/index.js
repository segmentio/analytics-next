module.exports = {
  createJestTSConfig: require('./jest/config').createJestTSConfig,
  lintStagedConfig: require('./lint-staged/config'),
  tsupConfig: require('./tsup/config'),
}
