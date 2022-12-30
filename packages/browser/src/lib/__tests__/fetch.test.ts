import { fetch } from '../fetch'
import { getGlobal } from '../get-global'
import unfetch from 'unfetch'

jest.mock('unfetch')
const unfetchMock = jest.mocked(unfetch).mockResolvedValue({} as Response)

jest.mock('../get-global')
const getGlobalMock = jest.mocked(getGlobal)

describe(fetch, () => {
  const testFetchArgs = ['http://foo.com', {}] as const

  it('should call native fetch if available', async () => {
    const nativeFetchSpy = jest.fn()
    getGlobalMock.mockReturnValue({ ...window, fetch: nativeFetchSpy })
    void fetch(...testFetchArgs)
    expect(nativeFetchSpy).toBeCalledWith(...testFetchArgs)
    expect(unfetchMock).not.toBeCalled()
  })
  it('should fall back to unfetch', async () => {
    getGlobalMock.mockReturnValue(null)
    void fetch(...testFetchArgs)
    expect(unfetchMock).toBeCalledWith(...testFetchArgs)
  })
})
