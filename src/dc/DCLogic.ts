import { useEffect, useReducer, useState } from 'react'

/**
 * Stand-in for the prototype runtime's DCLogic base class.
 *
 * The runtime merged setState into `state` synchronously and then re-rendered, so code that reads
 * `this.state` right after `setState` (or from a timer) sees the new values. React's own
 * setState is batched, so the ported logic keeps this class instead of extending React.Component.
 */
export class DCLogic<P, S> {
  declare state: S
  props: P
  private listeners = new Set<() => void>()

  constructor(props: P) {
    this.props = props
  }

  setState(patch: Partial<S> | ((state: S) => Partial<S>)) {
    const next = typeof patch === 'function' ? patch(this.state) : patch
    this.state = { ...this.state, ...next }
    this.listeners.forEach(fn => fn())
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  componentDidMount?(): void
  componentWillUnmount?(): void
}

/** Hosts a DCLogic instance in a function component: re-renders on setState, runs its lifecycle. */
export function useDCLogic<L extends DCLogic<unknown, unknown>>(create: () => L): L {
  const [logic] = useState(create)
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const unsubscribe = logic.subscribe(rerender)
    logic.componentDidMount?.()
    return () => {
      unsubscribe()
      logic.componentWillUnmount?.()
    }
  }, [logic])
  return logic
}
