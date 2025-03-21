# Node.js Compatibility Notes

## Supported Node.js Versions

This package officially supports:
- Node.js 12.22.0 and higher (as specified in `.nvmrc`)
- Node.js versions up to but not including 22.0.0
- Latest LTS versions within this range (12.x, 14.x, 16.x, 18.x, 20.x)

## Issue with Node.js 22+ and 23+

This package is **not compatible** with Node.js versions 22 and higher due to issues with a transitive dependency. Installation will fail if you're using Node.js 22+ or 23+.

### Problem

When installing with Node.js 22+ or 23+, the transitive dependency `@stdlib/number-float64-base-normalize` attempts to compile native code using node-gyp but fails with this error:

```
npm error gyp: binding.gyp not found (cwd: /path/to/node_modules/@stdlib/number-float64-base-normalize) while trying to load binding.gyp
```

This occurs because:
1. The package expects to build native code
2. It's missing the required `binding.gyp` file for the build
3. Newer versions of Node.js are stricter about this requirement

### Solutions

If you need to use this package, you have the following options:

#### Option 1: Use a Compatible Node.js Version (Required)

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

## Version Check Implementation

This package uses two mechanisms to enforce Node.js version compatibility:

1. **engines field**: The package.json includes an "engines" field that specifies the compatible Node.js version range:

```json
"engines": {
  "node": ">=12.22.0 <22.0.0"
}
```

2. **Strict enforcement**: A preinstall script (`scripts/check-node-version.js`) verifies the Node.js version and will abort the installation process with an error message if you're using an incompatible version.

The version check uses simple numeric comparison of the major Node.js version number to determine compatibility.

If you absolutely need to bypass this restriction (not recommended), you would need to:

1. Use `--ignore-scripts` to bypass the preinstall check:
```bash
npm install --ignore-scripts
```

2. And also use `--ignore-engines` to bypass the engines field check:
```bash
npm install --ignore-scripts --ignore-engines
```

However, even if installation succeeds with these flags, the package will likely fail at runtime due to the native module compilation issues. 