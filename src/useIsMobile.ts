import { useEffect, useState } from 'react'

/** Matches the prototype's 820px breakpoint for the mobile layout. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 820,
  )
  useEffect(() => {
    const onResize = () => {
      const m = window.innerWidth < 820
      setIsMobile((prev) => (prev !== m ? m : prev))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile
}
