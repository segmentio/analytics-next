import { BasePage } from '../../helpers/base-page-object'

export class IndexPage extends BasePage {
  constructor() {
    super(`/custom-elements/index.html`)
  }
}
