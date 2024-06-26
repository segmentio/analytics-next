import { BasePage } from '../../helpers/base-page'
import path from 'path'

export class IndexPage extends BasePage {
  constructor() {
    super(`file://${path.resolve(__dirname, 'index.html')}`)
  }
}
