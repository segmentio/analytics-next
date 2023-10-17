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

type BatchHandler = (batch: any) => void

export class MockSegmentServer {
  private server: ReturnType<typeof createServer>
  private port: number
  private onBatchHandlers: Set<BatchHandler> = new Set()

  constructor(port: number) {
    this.port = port
    this.server = createServer(async (req, res) => {
      if (!isBatchRequest(req)) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false }))
        return
      }

      const text = await getRequestText(req)
      const batch = JSON.parse(text)
      this.onBatchHandlers.forEach((handler) => {
        handler(batch)
      })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
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

  on(_event: 'batch', handler: BatchHandler) {
    this.onBatchHandlers.add(handler)
  }

  off(_event: 'batch', handler: BatchHandler) {
    this.onBatchHandlers.delete(handler)
  }
}
