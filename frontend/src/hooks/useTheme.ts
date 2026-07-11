import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMe } from '../api/me'
import type { UserProfile } from '../api/types'

function applyTheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

export function useTheme() {
  const isAuthed = !!localStorage.getItem('access_token')

  const { data: me } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: isAuthed,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (me !== undefined) {
      applyTheme(me.dark_mode)
      return
    }
    // System preference while not authenticated or before query resolves
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    applyTheme(mq.matches)
    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [me])
}
