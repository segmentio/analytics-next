#!/usr/bin/env node

/**
 * This script enforces Node.js version compatibility for this package.
 * The @june-so/analytics-next package is NOT compatible with Node.js 22+
 * due to issues with a native dependency.
 */

// Define compatible Node.js version ranges
const MIN_NODE_VERSION = 12;
const MAX_NODE_VERSION = 22;

// Get current Node.js major version
const currentVersion = Number(process.versions.node.split('.')[0]);

// Check if version is compatible
if (currentVersion >= MAX_NODE_VERSION) {
  console.error('\n\x1b[31mERROR: This package requires Node.js < 22.0.0\x1b[0m');
  console.error(`Current Node.js version: ${process.versions.node}`);
  console.error('\nThe package will fail to install due to native module compilation issues.');
  console.error('Please use a compatible Node.js version or see NODE_COMPATIBILITY.md for details.\n');
  
  // Exit with error code to abort installation
  process.exit(1);
}

// Optional: warn for version close to incompatible (e.g., v21.x)
if (currentVersion === MAX_NODE_VERSION - 1) {
  console.warn('\n\x1b[33mWARNING: You are using Node.js v21.x which is close to incompatible versions.\x1b[0m');
  console.warn('Future Node.js versions (22+) are not compatible with this package.\n');
}

// Also check minimum version
if (currentVersion < MIN_NODE_VERSION) {
  console.error('\n\x1b[31mERROR: This package requires Node.js >= 12.22.0\x1b[0m');
  console.error(`Current Node.js version: ${process.versions.node}`);
  console.error('\nPlease upgrade to a supported Node.js version.\n');
  
  // Exit with error code to abort installation
  process.exit(1);
} 