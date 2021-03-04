import http from 'http'
import fetch from 'node-fetch'
import querystring from 'querystring'
import handler from 'serve-handler'
import { classic, next } from './__fixtures__/snippets'

export async function startLocalServer(): Promise<string> {
  const srv = http.createServer((req, res) => {
    const query = querystring.parse(req.url!)

    if (req.url!.includes('next')) {
      res.end(next(query.wk as string))
      return
    }

    if (req.url!.includes('classic')) {
      res.end(classic(query.wk as string))
      return
    }

    handler(req, res)
  })

  return new Promise(async (resolve, reject) => {
    const desiredPort = process.env.PORT ?? 4000
    const desiredPath = `http://localhost:${desiredPort}`

    try {
      const ping = await fetch(desiredPath)
      if (ping.ok) {
        return resolve(desiredPath)
      }
    } catch (err) {
      srv.on('error', reject)
      srv.listen(desiredPort, () => {
        // @ts-expect-error
        const { port } = srv.address()
        resolve(`http://localhost:${port ?? desiredPort}`)
      })
    }
  })
}

let url: string
export const server = async () => {
  if (url) {
    return url
  }

  url = await startLocalServer().catch(() => url)
  return url
}
