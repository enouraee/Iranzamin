import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../../api/queryClient'
import { ToastProvider } from './Toast'
import { ThemeSync } from './ThemeSync'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  )
}
