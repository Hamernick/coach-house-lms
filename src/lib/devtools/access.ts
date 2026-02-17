export type DevtoolsAccessInput = {
  isAdmin?: boolean
  isTester?: boolean
}

export type DevtoolsAccess = {
  canSeeTestingMenu: boolean
  canOpenOnboarding: boolean
  canStartTutorials: boolean
  canShowWelcomeLaunchers: boolean
  canResetTutorials: boolean
  canResetOnboarding: boolean
  canSeedNotifications: boolean
  canRunSeedActions: boolean
  canUsePaymentPlayground: boolean
  canUseAutofillTools: boolean
}

export function resolveDevtoolsAccess({ isAdmin = false, isTester = false }: DevtoolsAccessInput): DevtoolsAccess {
  const testingAudience = isAdmin || isTester

  return {
    canSeeTestingMenu: testingAudience,
    canOpenOnboarding: testingAudience,
    canStartTutorials: testingAudience,
    canShowWelcomeLaunchers: testingAudience,
    canResetTutorials: testingAudience,
    canResetOnboarding: testingAudience,
    canSeedNotifications: isAdmin,
    canRunSeedActions: isAdmin,
    canUsePaymentPlayground: testingAudience,
    canUseAutofillTools: testingAudience,
  }
}
