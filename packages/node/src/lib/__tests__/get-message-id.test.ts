import { createMessageId } from '../get-message-id'

// https://gist.github.com/johnelliott/cf77003f72f889abbc3f32785fa3df8d
const uuidv4Regex =
  /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i

describe(createMessageId, () => {
  it('returns a string in the format "node-next-[unix epoch time]-[uuid v4]"', () => {
    const msg = createMessageId().split('-')
    expect(msg.length).toBe(8)

    expect(`${msg[0]}-${msg[1]}`).toBe('node-next')

    const epochTimeSeg = msg[2]
    expect(typeof parseInt(epochTimeSeg)).toBe('number')
    expect(epochTimeSeg.length > 10).toBeTruthy()

    const uuidSeg = msg.slice(3).join('-')
    expect(uuidSeg).toEqual(expect.stringMatching(uuidv4Regex))
  })
})
