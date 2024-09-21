module.exports = {
  ...require("@internal/config").lintStagedConfig,
  'src/lib/workerbox/*.{js,ts,html}': ['yarn workerbox']
}

