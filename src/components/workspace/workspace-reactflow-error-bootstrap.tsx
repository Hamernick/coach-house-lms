"use client"

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useStoreApi } from "reactflow"

const REACT_FLOW_TYPES_WARNING_CODE = "002"

export type WorkspaceReactFlowErrorHandler = (
  errorCode: string,
  message: string
) => void

export function WorkspaceReactFlowErrorBootstrap({
  onError,
  children,
}: {
  onError: WorkspaceReactFlowErrorHandler
  children: (onError: WorkspaceReactFlowErrorHandler) => ReactNode
}) {
  const store = useStoreApi()
  const onErrorRef = useRef(onError)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const handleReactFlowError = useMemo<WorkspaceReactFlowErrorHandler>(
    () => (errorCode, message) => {
      if (errorCode === REACT_FLOW_TYPES_WARNING_CODE) return
      onErrorRef.current(errorCode, message)
    },
    []
  )

  // React Flow v11 parses nodeTypes before StoreUpdater applies the onError prop.
  useLayoutEffect(() => {
    if (store.getState().onError !== handleReactFlowError) {
      store.setState({ onError: handleReactFlowError })
    }
    setReady(true)
  }, [handleReactFlowError, store])

  if (!ready) return null

  return <>{children(handleReactFlowError)}</>
}
