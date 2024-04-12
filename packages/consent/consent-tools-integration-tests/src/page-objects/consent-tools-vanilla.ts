import { BasePage } from './base-page'

export class ConsentToolsVanilla extends BasePage {
  clickGiveConsent() {
    return $('#give-consent').click()
  }
  clickDenyConsent() {
    return $('#deny-consent').click()
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
