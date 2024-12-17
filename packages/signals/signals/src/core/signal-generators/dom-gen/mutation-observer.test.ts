/* eslint-disable jest/no-done-callback */
import { sleep } from '@segment/analytics-core'
import {
  MutationObservable,
  MutationObservableSettings,
  MutationObservableSubscriber,
} from './mutation-observer'

describe('MutationObservable', () => {
  let mutationObservable: MutationObservable
  let testButton: HTMLButtonElement
  let testInput: HTMLInputElement
  const subscribeFn = jest.fn() as jest.Mock<MutationObservableSubscriber>
  beforeEach(() => {
    document.body.innerHTML =
      '<div id="test-element" role="button" aria-pressed="false"></div>' +
      '<input id="test-input" />'
    testButton = document.getElementById('test-element') as HTMLButtonElement
    testInput = document.getElementById('test-input') as HTMLInputElement
  })

  afterEach(() => {
    mutationObservable.cleanup()
  })

  it('should capture attribute changes', async () => {
    mutationObservable = new MutationObservable(
      new MutationObservableSettings({
        observedRoles: () => ['button'],
        observedAttributes: () => ['aria-pressed'],
        debounceMs: 500,
      })
    )

    mutationObservable.subscribe(subscribeFn)
    testButton.setAttribute('aria-pressed', 'true')
    await sleep(0)

    expect(subscribeFn).toHaveBeenCalledTimes(1)
    expect(subscribeFn).toHaveBeenCalledWith({
      element: testButton,
      attributes: [{ attributeName: 'aria-pressed', newValue: 'true' }],
    })
  })

  it('should capture multiple attribute changes', async () => {
    mutationObservable = new MutationObservable(
      new MutationObservableSettings({
        observedRoles: () => ['button'],
        observedAttributes: () => ['aria-pressed'],
        debounceMs: 500,
      })
    )

    mutationObservable.subscribe(subscribeFn)
    testButton.setAttribute('aria-pressed', 'true')
    await sleep(0)
    testButton.setAttribute('aria-pressed', 'false')
    await sleep(0)

    expect(subscribeFn).toHaveBeenCalledTimes(2)
    expect(subscribeFn).toHaveBeenNthCalledWith(1, {
      element: testButton,
      attributes: [{ attributeName: 'aria-pressed', newValue: 'true' }],
    })
    expect(subscribeFn).toHaveBeenNthCalledWith(2, {
      element: testButton,
      attributes: [{ attributeName: 'aria-pressed', newValue: 'false' }],
    })
  })

  it('should debounce attribute changes if they occur in text inputs', async () => {
    mutationObservable = new MutationObservable(
      new MutationObservableSettings({
        debounceMs: 100,
      })
    )
    mutationObservable.subscribe(subscribeFn)
    testInput.setAttribute('value', 'hello')
    await sleep(0)
    testInput.setAttribute('value', 'hello wor')
    await sleep(0)
    testInput.setAttribute('value', 'hello world')
    await sleep(200)

    expect(subscribeFn).toHaveBeenCalledTimes(1)
    expect(subscribeFn).toHaveBeenCalledWith({
      element: testInput,
      attributes: [{ attributeName: 'value', newValue: 'hello world' }],
    })
  })

  it('should not emit event for aria-selected=false', (done) => {
    mutationObservable = new MutationObservable(
      new MutationObservableSettings({
        observedRoles: () => ['button'],
        observedAttributes: () => ['aria-selected'],
      })
    )

    mutationObservable.subscribe(() => {
      done.fail('Should not emit event for aria-selected=false')
    })

    testButton.setAttribute('aria-selected', 'false')
    setTimeout(done, 1000) // Wait to ensure no event is emitted
  })
})
