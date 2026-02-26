# analytics-node e2e-cli

E2E test CLI for the [@segment/analytics-node](https://github.com/segmentio/analytics-next) Node.js SDK. Accepts a JSON input describing events and SDK configuration, sends them through the real SDK, and outputs results as JSON.

## Setup

```bash
npm install
npm run build
```

## Usage

```bash
node dist/cli.js --input '{"writeKey":"...", ...}'
```

## Input Format

```jsonc
{
  "writeKey": "your-write-key",       // required
  "apiHost": "https://...",           // optional — SDK default if omitted
  "sequences": [                      // required — event sequences to send
    {
      "delayMs": 0,
      "events": [
        { "type": "track", "event": "Test", "userId": "user-1" }
      ]
    }
  ],
  "config": {                         // optional
    "flushAt": 15,
    "flushInterval": 10000,
    "maxRetries": 3,
    "timeout": 15
  }
}
```

Note: Node is a server-side SDK — there is no CDN settings fetch, so `cdnHost` does not apply.

## Output Format

```json
{ "success": true, "sentBatches": 1 }
```

On failure:

```json
{ "success": false, "error": "description", "sentBatches": 0 }
```
