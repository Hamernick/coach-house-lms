import { DocumentationHome } from "./documentation-home"
import {
  DocumentationShell,
  type DocumentationShellState,
} from "./documentation-shell"

// Rendered only by the guarded visual-regression route. No session, entitlement,
// account, or organization is created to exercise these shell states.
export function DocumentationVisualFixture({ viewer }: { viewer: string }) {
  const paid = viewer === "paid"
  const state: DocumentationShellState | null =
    viewer === "anonymous"
      ? null
      : {
          sidebarTree: [],
          user: {
            name: "Library reader",
            title: null,
            email: null,
            avatar: null,
          },
          isAdmin: false,
          platformAccessLevel: null,
          isTester: false,
          showOrgAdmin: false,
          canAccessOrgAdmin: false,
          acceleratorProgress: null,
          showAccelerator: false,
          showLiveBadges: false,
          hasActiveSubscription: paid,
          hasBillingCancellationRisk: false,
          hasAcceleratorAccess: paid,
          hasElectiveAccess: false,
          ownedElectiveModuleSlugs: [],
          currentPlanTier: paid ? "organization" : "free",
          showMemberWorkspace: paid,
          memberWorkspaceHeader: null,
          organizationName: null,
          onboardingLocked: viewer === "locked",
          onboardingIntentFocus: viewer === "locked" ? "build" : null,
          formationStatus: null,
        }
  return (
    <DocumentationShell state={state} defaultSidebarOpen>
      <DocumentationHome />
    </DocumentationShell>
  )
}
