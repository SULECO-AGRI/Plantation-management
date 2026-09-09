import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingDataBand() {
  return (
    <section className="data-band">
      <div>
        <span className="eyebrow eyebrow--light">Uploaded estate dataset</span>
        <h2>5 divisions. 218 field polygons. One clean viewer.</h2>
      </div>
      <Link to="/map" className="secondary-cta">View Weddamulle Estate <ArrowRight size={17} /></Link>
    </section>
  )
}
