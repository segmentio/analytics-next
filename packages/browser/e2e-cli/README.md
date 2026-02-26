# analytics-browser e2e-cli

E2E test CLI for the [@segment/analytics-next](https://github.com/segmentio/analytics-next) browser SDK. Runs the browser SDK inside a jsdom environment, accepts a JSON input describing events and SDK configuration, and outputs results as JSON.

## Setup

```bash
npm install
npm run build
```

## Usage

```bash
node dist/cli.js --input '{"writeKey":"...", ...}'
```

Supports batching mode via environment variable:

```bash
BROWSER_BATCHING=true node dist/cli.js --input '...'
```

## Input Format

```jsonc
{
  "writeKey": "your-write-key",       // required
  "apiHost": "https://...",           // optional — SDK default if omitted
  "cdnHost": "https://...",           // optional — SDK default if omitted
  "sequences": [                      // required — event sequences to send
    {
      "delayMs": 0,
      "events": [
        { "type": "track", "event": "Test", "userId": "user-1" }
      ]
    }
  ],
  "config": {                         // optional
    "flushAt": 1,
    "flushInterval": 1000,
    "maxRetries": 3,
    "timeout": 15
  }
}
```

## Output Format

```json
{ "success": true, "sentBatches": 1 }
```

On failure:

```json
{ "success": false, "error": "description", "sentBatches": 0 }
```
