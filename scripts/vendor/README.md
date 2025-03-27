# Vendor Scripts

This directory contains scripts to vendor dependencies that cause issues with native builds (like node-gyp).

## Usage

To update or add a new vendored dependency, modify `webpack.config.vendor.js` and run:

```bash
npm run vendor
``` 