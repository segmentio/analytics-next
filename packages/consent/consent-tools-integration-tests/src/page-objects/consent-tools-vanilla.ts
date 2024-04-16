import { BasePage } from './base-page'

export class ConsentToolsVanilla extends BasePage {
  async clickGiveConsent() {
    const button = await $('#give-consent')
    return button.click()
  }
  async clickDenyConsent() {
    const button = await $('#give-consent')
    return button.click()
  }
}

export class ConsentToolsVanillaOptOut extends ConsentToolsVanilla {
  constructor() {
    super('consent-tools-vanilla-opt-out.html')
  }
}

export class ConsentToolsVanillaOptIn extends ConsentToolsVanilla {
  constructor() {
    super('consent-tools-vanilla.html')
  }
}
