import http from 'http'
import listen from 'test-listen'
import express from 'express'
import got from 'got'
import getExample from './get-example'

const app = express()
const server = http.createServer(app)
app.use(express.json())
app.use(getExample)

let url: string
beforeAll(
  async (): Promise<void> => {
    url = await listen(server)
  }
)

afterAll((cb): void => {
  server.close(cb)
})

test('returns status 200', async (): Promise<void> => {
  const res = await got(url, {
    throwHttpErrors: false,
    headers: {
      'User-Agent': 'Segment (test)',
    },
  })
  expect(res.statusCode).toEqual(200)
})
