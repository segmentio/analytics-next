import {
  BufferedPageContext,
  getDefaultBufferedPageContext,
  getDefaultPageContext,
  PageContext,
} from '../../core/page'

export const getPageCtxFixture = (): PageContext => getDefaultPageContext()

export const getBufferedPageCtxFixture = (): BufferedPageContext =>
  getDefaultBufferedPageContext()
