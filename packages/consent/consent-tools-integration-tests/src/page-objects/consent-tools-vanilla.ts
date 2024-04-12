import { BasePage } from './base-page'

export class ConsentToolsVanilla extends BasePage {
  constructor({ optIn }: { optIn: boolean }) {
    super(
      optIn
        ? 'consent-tools-vanilla.html'
        : 'consent-tools-vanilla-opt-out.html'
    )
  }

  clickGiveConsent() {
    return $('#give-consent').click()
  }
  clickDenyConsent() {
    return $('#deny-consent').click()
  }
}
