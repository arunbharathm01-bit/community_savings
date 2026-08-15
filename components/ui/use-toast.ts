'use client'

import * as React from 'react'

type ToastProps = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: 'default' | 'destructive'
}

type State = {
  toasts: ToastProps[]
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: { type: 'ADD_TOAST' | 'DISMISS_TOAST'; toast?: ToastProps; id?: string }) {
  if (action.type === 'ADD_TOAST' && action.toast) {
    const id = Math.random().toString(36).substring(2, 9)
    memoryState = { toasts: [{ ...action.toast, id }, ...memoryState.toasts].slice(0, 5) }
  } else if (action.type === 'DISMISS_TOAST' && action.id) {
    memoryState = { toasts: memoryState.toasts.filter((t) => t.id !== action.id) }
  }
  listeners.forEach((listener) => listener(memoryState))
}

export function toast(props: ToastProps) {
  dispatch({ type: 'ADD_TOAST', toast: props })
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    toast,
    toasts: state.toasts,
    dismiss: (id: string) => dispatch({ type: 'DISMISS_TOAST', id }),
  }
}
