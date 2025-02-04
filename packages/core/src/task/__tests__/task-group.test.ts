import { createTaskGroup } from '../task-group'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('TaskGroup', () => {
  it('works with concurrent operations', async () => {
    const group = createTaskGroup()
    const a = jest.fn()
    const b = jest.fn()

    void group.run(async () => {
      await sleep(100)
      a()
    })
    void group.run(async () => {
      await sleep(1000)
      b()
    })

    await group.done()
    expect(a).toBeCalled()
    expect(b).toBeCalled()
  })
})
