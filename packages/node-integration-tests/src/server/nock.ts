import nock from 'nock'

export const nockRequests = () => {
  nock.disableNetConnect()
  let batchEventsTotal = 0
  let requestTotal = 0
  nock('https://api.s.dreamdata.io') // using regex matching in nock changes the perf profile quite a bit
    .post('/v1/batch', (body: any) => {
      requestTotal += 1
      const events = body.batch.length
      batchEventsTotal += events
      return true
    })
    .reply(201)
    .persist()

  return {
    getRequestTotal() {
      return requestTotal
    },
    getBatchEventsTotal() {
      return batchEventsTotal
    },
  }
}
