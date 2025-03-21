# Node.js Compatibility Notes

## Supported Node.js Versions

This package officially supports:
- Node.js 12.22.0 and higher (as specified in `.nvmrc`)
- Node.js versions up to but not including 22.0.0
- Latest LTS versions within this range (12.x, 14.x, 16.x, 18.x, 20.x)

## Version History

- From version 3.0.0 onwards, this package provides warnings about Node.js version compatibility during installation
- Version 3.0.0 represents a major version increase to highlight potential compatibility issues

## Issue with Node.js 22+ and 23+

This package may experience problems with Node.js versions 22 and higher due to issues with a transitive dependency. You'll receive a warning if you're using Node.js 22+ or 23+.

### Problem

When running with Node.js 22+ or 23+, the transitive dependency `@stdlib/number-float64-base-normalize` may encounter issues because it attempts to compile native code using node-gyp but may fail with this error:

```
npm error gyp: binding.gyp not found (cwd: /path/to/node_modules/@stdlib/number-float64-base-normalize) while trying to load binding.gyp
```

This occurs because:
1. The package expects to build native code
2. It's missing the required `binding.gyp` file for the build
3. Newer versions of Node.js are stricter about this requirement

### Recommended Solutions

If you encounter runtime issues with this package on Node.js 22+, you have the following options:

#### Option 1: Use a Compatible Node.js Version (Recommended)

Use a Node.js version lower than 22.0.0. The most recent stable version that works well is 20.x LTS.

```bash
# Using nvm
nvm install 20
nvm use 20

# Using volta
volta install node@20
```

#### Option 2: Use a Docker Environment

If you need to maintain Node.js 22+ for your project, consider using a Docker container with a compatible Node.js version specifically for running this package.

#### Option 3: Pin to an Earlier Version (2.x)

If you encounter problems and cannot change your Node.js version, you can pin your dependency to version 2.0.0.

```json
"dependencies": {
  "@june-so/analytics-next": "2.0.0"
}
```

## Version Check Implementation

This package uses two mechanisms to provide Node.js version compatibility information:

1. **engines field**: The package.json includes an "engines" field that indicates the compatible Node.js version range:

```json
"engines": {
  "node": ">=12.22.0 <22.0.0"
}
```

2. **Warning notification**: A preinstall script (`scripts/check-node-version.js`) verifies the Node.js version and will display warning messages if you're using a potentially incompatible version.

If you prefer to suppress these warnings, you can use `--ignore-scripts` when installing:

```bash
npm install --ignore-scripts
``` 