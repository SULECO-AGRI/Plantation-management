import L from 'leaflet'

if (typeof window !== 'undefined') {
  ;(window as any).L = L
}

export async function ensureVectorGrid(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  ;(window as any).L = L
  if (!(L as any).vectorGrid) {
    try {
      await import('leaflet.vectorgrid')
      return true
    } catch (e) {
      console.error('Failed to load leaflet.vectorgrid', e)
      return false
    }
  }
  return true
}
