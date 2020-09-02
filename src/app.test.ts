import http from 'http'
import listen from 'test-listen'
import got from 'got'
import app from './app'

const server = http.createServer(app)
let url: string
beforeAll(
  async (): Promise<void> => {
    url = await listen(server)
  }
)

afterAll((cb): void => {
  server.close(cb)
})

test('returns status 400 when user-agent is missing', async (): Promise<void> => {
  const res = await got(url, { throwHttpErrors: false })
  expect(res.statusCode).toEqual(400)
})

test('healthcheck returns status 200 without a user-agent', async (): Promise<void> => {
  const res = await got(`${url}/healthcheck`, { throwHttpErrors: false })
  expect(res.statusCode).toEqual(200)
})

test('invalid json returns status 400', async (): Promise<void> => {
  const res = await got.post(url, {
    throwHttpErrors: false,
    headers: {
      'Content-Type': 'application/json',
    },
    body: 'derp',
  })
  expect(res.statusCode).toEqual(400)
  expect(res.body).toContain('Unexpected token')
})
