const config = (() => {
  try {
    return require('./.env.local.js')
  } catch (e) {
    // ignore
  }
})()

/** @type {import('next').NextConfig} */
console.log('.env.local.js detected', config)

const nextConfig = {
  publicRuntimeConfig: config,
  serverRuntimeConfig: config,
  reactStrictMode: false,
}

module.exports = nextConfig
