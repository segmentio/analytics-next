import fetch from 'node-fetch'
import http from 'http'
import handler from 'serve-handler'

export async function startLocalServer(): Promise<string> {
  const srv = http.createServer((request, response) => {
    return handler(request, response)
  })

  return new Promise(async (resolve, reject) => {
    const desiredPort = process.env.PORT ?? 5000
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
