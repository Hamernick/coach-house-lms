import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Drawer } from 'vaul'
import { useWorkspaceDrawerSnapPoints } from '../../../src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/use-workspace-drawer-snap-points'

// Exercise a portal that becomes available after the root's snap effect.
// No application data, authentication, or provider requests are used.
function LateContent({ delay }: { delay: number }) {
  const [mounted, setMounted] = useState(delay === 0)
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(timer)
  }, [delay])
  if (!mounted) return null
  return <Drawer.Portal><Drawer.Content
    aria-describedby={undefined}
    className="drawer"
  ><Drawer.Title>Drawer</Drawer.Title><Drawer.Handle />Content</Drawer.Content></Drawer.Portal>
}

function Case({ fixed, delay }: { fixed: boolean; delay: number }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const observedSnapPoints = useWorkspaceDrawerSnapPoints(fixed ? container : null)
  const [snap, setSnap] = useState<number | string | null>('68px')
  useEffect(() => {
    if (!container) return
    const timer = setTimeout(() => { container.style.height = '320px' }, 1000)
    return () => clearTimeout(timer)
  }, [container])
  return <section data-case={`${fixed ? 'fixed' : 'baseline'}-${delay}`}>
    <h2>{fixed ? 'Fixed' : 'Baseline'} / portal delay {delay}ms</h2>
    <div className="canvas" ref={setContainer}>
      <Drawer.Root open={Boolean(container)} container={container ?? undefined}
        snapPoints={fixed ? observedSnapPoints : ['68px', 0.48, 1]} activeSnapPoint={snap} setActiveSnapPoint={setSnap}
        modal={false} dismissible={false} noBodyStyles handleOnly>
        {container ? <LateContent delay={delay} /> : null}
      </Drawer.Root>
    </div>
    <button onClick={() => setSnap('68px')}>Collapsed</button>
    <button onClick={() => setSnap(0.48)}>Half</button>
    <button onClick={() => setSnap(1)}>Full</button>
  </section>
}
createRoot(document.getElementById('root')!).render(<>{[false,true].flatMap(fixed => [0,60].map(delay => <Case key={`${fixed}-${delay}`} fixed={fixed} delay={delay} />))}</>)
