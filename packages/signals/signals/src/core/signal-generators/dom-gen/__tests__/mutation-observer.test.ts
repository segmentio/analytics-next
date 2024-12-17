/* eslint-disable jest/no-done-callback */
import { sleep } from '@segment/analytics-core'
import {
  MutationObservable,
  MutationObservableSettings,
  MutationObservableSubscriber,
} from '../mutation-observer'

describe('MutationObservable', () => {
  let mutationObservable: MutationObservable
  let testButton: HTMLButtonElement
  let testInput: HTMLInputElement
  const subscribeFn = jest.fn() as jest.Mock<MutationObservableSubscriber>
  beforeEach(() => {
    document.body.innerHTML =
      '<div id="test-element" role="button" aria-pressed="false"></div>' +
      '<input id="test-input" value="" aria-foo="123" />'
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
      attributes: { 'aria-pressed': 'true' },
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
      attributes: { 'aria-pressed': 'true' },
    })
    expect(subscribeFn).toHaveBeenNthCalledWith(2, {
      element: testButton,
      attributes: { 'aria-pressed': 'false' },
    })
  })

  it('should debounce text inputs', async () => {
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
      attributes: { value: 'hello world' },
    })
  })
  it('should debounce tect inputs if happening in the same tick', async () => {
    mutationObservable = new MutationObservable(
      new MutationObservableSettings({
        debounceMs: 100,
      })
    )
    mutationObservable.subscribe(subscribeFn)
    testInput.setAttribute('value', 'hello')
    testInput.setAttribute('value', 'hello wor')
    testInput.setAttribute('value', 'hello world')
    await sleep(100)

    expect(subscribeFn).toHaveBeenCalledTimes(1)
    expect(subscribeFn).toHaveBeenCalledWith({
      element: testInput,
      attributes: { value: 'hello world' },
    })
  })

  it('should handle multiple attributes changing', async () => {
    mutationObservable = new MutationObservable(
      new MutationObservableSettings({
        debounceMs: 100,
        observedAttributes: (roles) => [...roles, 'aria-foo'],
      })
    )
    mutationObservable.subscribe(subscribeFn)
    testInput.setAttribute('value', 'hello')
    testInput.setAttribute('aria-foo', 'bar')
    await sleep(200)

    expect(subscribeFn).toHaveBeenCalledTimes(1)
    expect(subscribeFn).toHaveBeenCalledWith({
      element: testInput,
      attributes: { value: 'hello', 'aria-foo': 'bar' },
    })
  })

  it('should not emit duplicate events', async () => {
    mutationObservable = new MutationObservable(
      new MutationObservableSettings({
        observedRoles: () => ['button'],
        observedAttributes: () => ['aria-pressed'],
        debounceMs: 0,
      })
    )

    mutationObservable.subscribe(subscribeFn)
    testButton.setAttribute('aria-pressed', 'true')
    await sleep(0)
    testButton.setAttribute('aria-pressed', 'true')
    await sleep(0)

    expect(subscribeFn).toHaveBeenCalledTimes(1)
    expect(subscribeFn).toHaveBeenCalledWith({
      element: testButton,
      attributes: { 'aria-pressed': 'true' },
    })
  })

  it('should not emit duplicate events if overlapping', async () => {
    mutationObservable = new MutationObservable(
      new MutationObservableSettings({
        observedRoles: () => ['button'],
        observedAttributes: () => ['aria-pressed', 'aria-foo'],
        debounceMs: 0,
      })
    )

    mutationObservable.subscribe(subscribeFn)
    testButton.setAttribute('aria-pressed', 'true')
    testButton.setAttribute('aria-foo', 'bar')
    await sleep(0)

    testButton.setAttribute('aria-pressed', 'false')
    await sleep(50)

    testButton.setAttribute('aria-pressed', 'false')
    await sleep(50)

    testButton.setAttribute('aria-foo', 'bar')
    await sleep(50)

    expect(subscribeFn).toHaveBeenNthCalledWith(1, {
      element: testButton,
      attributes: { 'aria-pressed': 'true', 'aria-foo': 'bar' },
    })

    expect(subscribeFn).toHaveBeenNthCalledWith(2, {
      element: testButton,
      attributes: { 'aria-pressed': 'false' },
    })
    expect(subscribeFn).toHaveBeenCalledTimes(2)
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
