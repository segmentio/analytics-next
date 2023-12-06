import { createServer, IncomingMessage } from 'http'

async function getRequestText(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const data: Buffer[] = []
    req.on('error', reject)
    req.on('data', (chunk) => {
      data.push(chunk)
    })
    req.on('end', () => {
      resolve(Buffer.concat(data).toString())
    })
  })
}

function isBatchRequest(req: IncomingMessage) {
  if (req.url?.endsWith('/v1/batch')) {
    return true
  }
  return false
}

function isTokenRequest(req: IncomingMessage) {
  if (req.url?.endsWith('/token')) {
    return true
  }
  return false
}

type BatchHandler = (batch: any) => void
type TokenHandler = (token: any) => void

export class MockSegmentServer {
  private server: ReturnType<typeof createServer>
  private port: number
  private onBatchHandlers: Set<BatchHandler> = new Set()
  private onTokenHandlers: Set<TokenHandler> = new Set()

  constructor(port: number) {
    this.port = port
    this.server = createServer(async (req, res) => {
      if (!isBatchRequest(req) && !isTokenRequest(req)) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false }))
        return
      }

      const text = await getRequestText(req)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      if (isBatchRequest(req)) {
        const batch = JSON.parse(text)
        this.onBatchHandlers.forEach((handler) => {
          handler(batch)
        })
        res.end(JSON.stringify({ success: true }))
      } else if (isTokenRequest(req)) {
        this.onTokenHandlers.forEach((handler) => {
          handler(text)
        })
        res.end(
          JSON.stringify({
            access_token: '__TOKEN__',
            token_type: 'Bearer',
            scope: 'tracking_api:write',
            expires_in: 86400,
          })
        )
      }
    })
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.on('error', reject)
      this.server.listen(this.port, () => {
        resolve()
      })
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.onBatchHandlers.clear()
      this.server.close((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  on(_event: 'batch' | 'token', handler: BatchHandler) {
    if (_event === 'batch') {
      this.onBatchHandlers.add(handler)
    } else if (_event === 'token') {
      this.onTokenHandlers.add(handler)
    }
  }

  off(_event: 'batch' | 'token', handler: BatchHandler) {
    if (_event === 'batch') {
      this.onBatchHandlers.delete(handler)
    } else if (_event === 'token') {
      this.onTokenHandlers.delete(handler)
    }
  }
}
