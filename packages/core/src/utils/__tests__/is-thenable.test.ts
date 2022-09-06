import { isThenable } from '../is-thenable'

describe('isThenable', () => {
  test('es6 promises', () => {
    const p = Promise.resolve(1)
    expect(isThenable(p)).toBeTruthy()
  })

  test('on the prototype', () => {
    class Foo {
      then() {
        return '123'
      }
    }
    const p = new Foo()
    expect(isThenable(p)).toBeTruthy()
  })

  test('on the pojo', () => {
    const p = {
      then: () => {
        return '123'
      },
    }
    expect(isThenable(p)).toBeTruthy()
  })

  test('unhappy path', () => {
    expect(isThenable(null)).toBeFalsy()
    expect(isThenable(undefined)).toBeFalsy()
    expect(isThenable({})).toBeFalsy()
    expect(
      isThenable({
        then: true,
      })
    ).toBeFalsy()
    expect(isThenable(new (class Foo {})())).toBeFalsy()
  })
})
