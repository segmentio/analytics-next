import http from 'http'
import listen from 'test-listen'
import express from 'express'
import got from 'got'
import postExample from './post-example'

const app = express()
const server = http.createServer(app)
app.use(express.json())
app.use(postExample)

let url: string
beforeAll(
  async (): Promise<void> => {
    url = await listen(server)
  }
)

afterAll((cb): void => {
  server.close(cb)
})

test('returns 400 error for missing name', async (): Promise<void> => {
  const res = await got(url, {
    throwHttpErrors: false,
    headers: {
      'User-Agent': 'Segment (test)',
    },
  })
  expect(res.statusCode).toEqual(400)
  expect(res.body).toContain('Missing name')
})
