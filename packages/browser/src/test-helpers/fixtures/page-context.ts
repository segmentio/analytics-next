import {
  type BufferedPageContext,
  type PageContext,
  getDefaultBufferedPageContext,
  getDefaultPageContext,
} from '../../core/page'

export const getPageCtxFixture = (): PageContext => getDefaultPageContext()

export const getBufferedPageCtxFixture = (): BufferedPageContext =>
  getDefaultBufferedPageContext()
