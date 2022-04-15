// Modify this to set production parameters.
const USE_LOCAL_API = false;

// We need a different Node endpoint, otherwise the containers can't communicate.
export const CONFIG_NODE = USE_LOCAL_API ? {
    httpScheme: 'http',
    apiHost: 'api:3001/sdk'
} : {}

export const CONFIG_BROWSER = USE_LOCAL_API ? {
    apiHost: "localhost:3001/sdk"
} : {}