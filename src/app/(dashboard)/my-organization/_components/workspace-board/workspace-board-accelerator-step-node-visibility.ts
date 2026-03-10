export type AcceleratorStepNodeVisibilityTransitionInput = {
  acceleratorCardVisible: boolean
  stepNodeVisible: boolean
  restoreStepNodeOnCardShow: boolean
}

export type AcceleratorStepNodeVisibilityTransition = {
  stepNodeVisible: boolean
  restoreStepNodeOnCardShow: boolean
}

export function resolveAcceleratorStepNodeVisibilityTransition({
  acceleratorCardVisible,
  stepNodeVisible,
  restoreStepNodeOnCardShow,
}: AcceleratorStepNodeVisibilityTransitionInput): AcceleratorStepNodeVisibilityTransition {
  if (!acceleratorCardVisible) {
    return {
      stepNodeVisible: false,
      restoreStepNodeOnCardShow: restoreStepNodeOnCardShow || stepNodeVisible,
    }
  }

  if (restoreStepNodeOnCardShow) {
    return {
      stepNodeVisible: true,
      restoreStepNodeOnCardShow: false,
    }
  }

  return {
    stepNodeVisible,
    restoreStepNodeOnCardShow,
  }
}
