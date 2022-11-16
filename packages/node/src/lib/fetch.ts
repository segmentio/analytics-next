import { default as nodeFetch } from 'node-fetch'

// made this a default export so it mocks the same as node-fetch in tests.
const fetch = globalThis.fetch || nodeFetch

export default fetch
