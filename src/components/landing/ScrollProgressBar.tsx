import { useEffect, useState } from 'react'

export function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPx = window.scrollY || document.documentElement.scrollTop
          const winHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
          if (winHeight > 0) {
            const progress = (scrollPx / winHeight) * 100
            setScrollProgress(Math.min(100, Math.max(0, progress)))
          } else {
            setScrollProgress(0)
          }
          ticking = false
        })
        ticking = true
      }
    }

    // Measure initially on mount
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <div
      className="scroll-progress-container"
      role="progressbar"
      aria-label="Landing page scroll progress"
      aria-valuenow={Math.round(scrollProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="scroll-progress-bar"
        style={{
          transform: `scaleX(${scrollProgress / 100})`,
        }}
      />
    </div>
  )
}
